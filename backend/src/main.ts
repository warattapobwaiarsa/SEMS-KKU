import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { TransformInterceptor } from './common/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (such as mobile apps, server-to-server, or curl)
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured origins or wildcard
      if (
        defaultOrigins.includes(origin) ||
        envOrigins.includes(origin) ||
        envOrigins.includes('*')
      ) {
        return callback(null, true);
      }

      // Automatically allow all Vercel deployments (*.vercel.app)
      if (/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-user-role',
      'X-User-Id',
      'x-user-id',
    ],
  });
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT ?? process.env.BACKEND_PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend is running on: http://localhost:${port}/api/v1`);
}
void bootstrap();
