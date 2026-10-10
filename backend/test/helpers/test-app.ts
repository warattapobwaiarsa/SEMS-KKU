import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/http-exception.filter';
import { TransformInterceptor } from '../../src/common/transform.interceptor';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * สร้าง app สำหรับ e2e test โดย:
 * - ใช้ AppModule ตัวเดียวกับตัวจริง (guard/pipe/interceptor/filter ของจริงทุกชั้น)
 * - เปลี่ยน PrismaService เป็น fake in-memory — ไม่ต่อฐานข้อมูลจริงเด็ดขาด
 * - ใช้ filter/interceptor ตัวเดียวกับ main.ts (ของทีม) — ⚠️ ไฟล์นี้ต้อง sync กับ src/main.ts เสมอ
 */
export async function createTestApp(fake: object): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(fake)
    .compile();

  const app = moduleFixture.createNestApplication();

  // ---- ต้อง sync กับ src/main.ts เสมอ (ห้ามให้ setup ของ test ต่างจากของจริง) ----
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
  // ---- จบส่วนที่ sync ----

  await app.init();
  return app;
}
