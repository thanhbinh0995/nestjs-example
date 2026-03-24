import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT as string, 10) || 3000,
  nodeEnv: process.env.NODE_ENV,
  apiPrefix: process.env.API_PREFIX,
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
}));
