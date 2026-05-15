import { Controller } from '@nestjs/common';
import { GrpcStreamCall } from '@nestjs/microservices';
import type { ServerReadableStream } from '@grpc/grpc-js';
import { UploadService } from '@/modules/upload/upload.service';
import type { UploadedFileInfo } from '@/modules/upload/upload.service';

interface UploadDocumentChunk {
  metadata?: {
    originalName: string;
    mimetype: string;
  };
  data?: Buffer | Uint8Array;
}

@Controller()
export class GrpcUploadController {
  constructor(private readonly uploadService: UploadService) {}

  @GrpcStreamCall('DocumentUploadService', 'UploadDocument')
  uploadDocument(
    requestStream: ServerReadableStream<UploadDocumentChunk, UploadedFileInfo>,
    callback: (err: { code: number; message: string } | null, value?: UploadedFileInfo) => void,
  ): void {
    this.uploadService.saveDocumentFromGrpcStream(requestStream, callback);
  }
}
