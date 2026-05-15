import { registerAs } from '@nestjs/config';

export default registerAs('upload', () => ({
  dest: process.env.UPLOAD_DEST ?? 'uploads',
  maxMb: parseInt(process.env.UPLOAD_MAX_MB ?? '5', 10) || 5,
  grpcMaxMb: parseInt(process.env.UPLOAD_GRPC_MAX_MB ?? '100', 10) || 100,
}));
