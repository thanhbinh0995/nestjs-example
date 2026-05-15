import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import type { Metadata } from '@grpc/grpc-js';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  getRequest(context: ExecutionContext) {
    if (context.getType() === 'rpc') {
      const metadata = context.switchToRpc().getContext<Metadata>();
      const authorization = metadata.get('authorization')?.[0];
      return {
        headers: {
          authorization: typeof authorization === 'string' ? authorization : '',
        },
      };
    }
    return context.switchToHttp().getRequest();
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    info: Error | undefined,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      if (context.getType() === 'rpc') {
        throw new RpcException({
          code: GrpcStatus.UNAUTHENTICATED,
          message: info?.message ?? err?.message ?? 'Unauthorized',
        });
      }
      throw err ?? new UnauthorizedException();
    }
    return user;
  }
}
