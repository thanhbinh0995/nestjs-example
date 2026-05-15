import { Module } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        storage: diskStorage({
          destination: join(process.cwd(), config.get<string>('upload.dest', 'uploads')),
          filename: (_req, file, cb) => {
            cb(null, `${uuid()}${extname(file.originalname)}`);
          },
        }),
        limits: {
          fileSize: config.get<number>('upload.maxMb', 5) * 1024 * 1024,
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
