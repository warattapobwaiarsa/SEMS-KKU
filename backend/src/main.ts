import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global ValidationPipe ตามที่ spec กำหนด:
  // - whitelist: ตัดฟิลด์ที่ไม่มีใน DTO ทิ้งทุกคำขอ
  // - forbidNonWhitelisted: ปฏิเสธ (400) ถ้ามีการส่งฟิลด์แปลกปลอมมา
  // - transform: แปลงชนิดข้อมูล payload ตามที่ DTO ประกาศอัตโนมัติ
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ครอบผลลัพธ์ที่สำเร็จทุกตัวให้อยู่ใน Envelope มาตรฐาน
  // (REST API spec หัวข้อ 2.2: { success, statusCode, data, meta? })
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  app.enableCors();
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT ?? process.env.BACKEND_PORT ?? 4000;
  await app.listen(port);
  console.log(`Backend is running on: http://localhost:${port}/api/v1`);
}
void bootstrap();
