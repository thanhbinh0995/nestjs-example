import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { PostsModule } from '@/modules/posts/posts.module';
import { GrpcHealthController } from './grpc-health.controller';
import { GrpcUploadController } from './grpc-upload.controller';
import { GrpcPostsController } from './grpc-posts.controller';

@Module({
  imports: [AuthModule, UploadModule, PostsModule],
  controllers: [GrpcHealthController, GrpcUploadController, GrpcPostsController],
})
export class GrpcModule {}
