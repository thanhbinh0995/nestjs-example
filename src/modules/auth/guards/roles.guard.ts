import { ExecutionContext, ForbiddenException, Injectable, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@/modules/users/entities/user.entity';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { isEmpty } from 'class-validator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || isEmpty(requiredRoles)) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException('You are not authorized to access this resource');
    }
    return true;
  }
}
