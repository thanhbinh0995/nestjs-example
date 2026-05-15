import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ALLOWED_DOCUMENT_MIMETYPES, UploadService } from './upload.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Auth } from '@/common/decorators/auth.decorator';

const MB = 1024 * 1024;

@Auth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addValidator(new MaxFileSizeValidator({ maxSize: 5 * MB }))
        .addValidator(
          new FileTypeValidator({
            fileType: /image\/(jpeg|png|webp)/,
            fallbackToMimetype: true,
          }),
        )
        .build(),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.toFileInfo(file);
  }

  @Post('documents')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadDocuments(@UploadedFiles() files: Express.Multer.File[]) {
    files.forEach((f) => this.uploadService.validateMimeType(f, ALLOWED_DOCUMENT_MIMETYPES));
    return files.map((f) => this.uploadService.toFileInfo(f));
  }
}
