import { UseGuards, applyDecorators } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';

export function Auth() {
  return applyDecorators(UseGuards(JwtAuthGuard, RolesGuard));
}
