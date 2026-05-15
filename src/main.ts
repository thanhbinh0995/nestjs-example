import { NestFactory, Reflector } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { ReflectionService } from '@grpc/reflection';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as morgan from 'morgan';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const grpcPort = configService.get<number>('app.grpcPort', 50051);
  const grpcReflection = configService.get<boolean>('app.grpcReflection', true);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  app.use(helmet());
  app.enableCors({
    origin: nodeEnv === 'production' ? configService.get('app.allowedOrigins') : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.use(compression());

  // HTTP Logging (dev only)
  if (nodeEnv === 'development') {
    app.use(morgan('dev'));
  }

  app.setGlobalPrefix(apiPrefix);

  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: ['health', 'upload', 'posts'],
      protoPath: [
        join(__dirname, 'proto', 'health.proto'),
        join(__dirname, 'proto', 'upload.proto'),
        join(__dirname, 'proto', 'posts.proto'),
      ],
      url: `0.0.0.0:${grpcPort}`,
      ...(grpcReflection && {
        onLoadPackageDefinition(pkg, server) {
          const reflection = new ReflectionService(pkg);
          reflection.addToServer(server);
        },
      }),
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);
  logger.log(`Application running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`gRPC listening on 0.0.0.0:${grpcPort} (packages: health, upload, posts)`);
  if (grpcReflection) {
    logger.log('gRPC reflection enabled (grpcurl/postman can introspect without -proto)');
  }
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap();
