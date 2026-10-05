import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT ?? process.env.BACKEND_PORT ?? 4000;
  await app.listen(port);
  console.log(`Backend is running on: http://localhost:${port}/api/v1`);
}
void bootstrap();
