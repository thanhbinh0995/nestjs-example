import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { status as GrpcStatus } from '@grpc/grpc-js';
import type { ServerReadableStream } from '@grpc/grpc-js';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';

export const ALLOWED_DOCUMENT_MIMETYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export interface UploadedFileInfo {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

interface UploadDocumentChunk {
  metadata?: {
    originalName: string;
    mimetype: string;
  };
  data?: Buffer | Uint8Array;
}

type GrpcUploadCallback = (
  err: { code: number; message: string } | null,
  value?: UploadedFileInfo,
) => void;

@Injectable()
export class UploadService {
  constructor(private readonly config: ConfigService) {}

  private get uploadDir(): string {
    return join(process.cwd(), this.config.get<string>('upload.dest', 'uploads'));
  }

  private get grpcMaxBytes(): number {
    const mb = this.config.get<number>('upload.grpcMaxMb', 100);
    return mb * 1024 * 1024;
  }

  buildUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  toFileInfo(file: Express.Multer.File): UploadedFileInfo {
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: this.buildUrl(file.filename),
    };
  }

  deleteFile(filename: string): void {
    const fullPath = join(this.uploadDir, filename);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  }

  validateMimeType(file: Express.Multer.File, allowed: readonly string[]): void {
    if (!allowed.includes(file.mimetype)) {
      this.deleteFile(file.filename);
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Allowed: ${allowed.join(', ')}`,
      );
    }
  }

  saveDocumentFromGrpcStream(
    requestStream: ServerReadableStream<UploadDocumentChunk, UploadedFileInfo>,
    callback: GrpcUploadCallback,
  ): void {
    let writeStream: ReturnType<typeof createWriteStream> | null = null;
    let filename: string | null = null;
    let originalName = '';
    let mimetype = '';
    let size = 0;
    let metadataReceived = false;
    let finished = false;

    const fail = (code: number, message: string): void => {
      if (finished) return;
      finished = true;
      if (filename) this.deleteFile(filename);
      writeStream?.destroy();
      callback({ code, message });
    };

    const succeed = (): void => {
      if (finished || !filename) return;
      finished = true;
      callback(null, {
        originalName,
        filename,
        mimetype,
        size,
        url: this.buildUrl(filename),
      });
    };

    requestStream.on('data', (chunk: UploadDocumentChunk) => {
      if (finished) return;

      try {
        if (!metadataReceived) {
          const meta = chunk.metadata;
          if (!meta?.originalName || !meta?.mimetype) {
            requestStream.destroy();
            return fail(
              GrpcStatus.INVALID_ARGUMENT,
              'First chunk must include metadata with originalName and mimetype',
            );
          }
          if (!ALLOWED_DOCUMENT_MIMETYPES.includes(meta.mimetype as (typeof ALLOWED_DOCUMENT_MIMETYPES)[number])) {
            requestStream.destroy();
            return fail(GrpcStatus.INVALID_ARGUMENT, `File type "${meta.mimetype}" is not allowed`);
          }

          metadataReceived = true;
          originalName = meta.originalName;
          mimetype = meta.mimetype;
          filename = `${uuid()}${extname(originalName)}`;

          mkdirSync(this.uploadDir, { recursive: true });
          writeStream = createWriteStream(join(this.uploadDir, filename));
          writeStream.on('error', (err) => {
            requestStream.destroy();
            fail(GrpcStatus.INTERNAL, err.message);
          });
        }

        if (!chunk.data?.length) return;

        const buf = Buffer.isBuffer(chunk.data) ? chunk.data : Buffer.from(chunk.data);
        size += buf.length;
        if (size > this.grpcMaxBytes) {
          requestStream.destroy();
          return fail(
            GrpcStatus.RESOURCE_EXHAUSTED,
            `File exceeds maximum size of ${this.grpcMaxBytes} bytes`,
          );
        }

        if (!writeStream!.write(buf)) {
          requestStream.pause();
          writeStream!.once('drain', () => requestStream.resume());
        }
      } catch (err) {
        requestStream.destroy();
        fail(GrpcStatus.INTERNAL, err instanceof Error ? err.message : 'Upload failed');
      }
    });

    requestStream.on('end', () => {
      if (finished) return;

      if (!metadataReceived || !writeStream || !filename) {
        return fail(GrpcStatus.INVALID_ARGUMENT, 'No file data received');
      }

      writeStream.end(() => succeed());
    });

    requestStream.on('error', (err) => {
      fail(GrpcStatus.INTERNAL, err.message);
    });
  }
}
