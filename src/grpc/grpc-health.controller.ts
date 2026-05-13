import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class GrpcHealthController {
  @GrpcMethod('HealthService', 'Check')
  check() {
    return {
      status: 'OK',
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}
