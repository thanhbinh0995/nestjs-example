import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { UseGuards, applyDecorators } from '@nestjs/common';

export function Auth() {
  return applyDecorators(UseGuards(JwtAuthGuard));
}
