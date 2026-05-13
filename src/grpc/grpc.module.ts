import { Module } from '@nestjs/common';
import { GrpcHealthController } from './grpc-health.controller';

@Module({
  controllers: [GrpcHealthController],
})
export class GrpcModule {}
