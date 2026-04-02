import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

export interface UploadedFileInfo {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

@Injectable()
export class UploadService {
  private readonly uploadDest = process.env.UPLOAD_DEST ?? 'uploads';

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
    const fullPath = join(process.cwd(), this.uploadDest, filename);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  }

  validateMimeType(file: Express.Multer.File, allowed: string[]): void {
    if (!allowed.includes(file.mimetype)) {
      this.deleteFile(file.filename);
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Allowed: ${allowed.join(', ')}`,
      );
    }
  }
}
