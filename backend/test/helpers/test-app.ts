import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { ResponseTransformInterceptor } from '../../src/common/interceptors/response-transform.interceptor';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * สร้าง app สำหรับ e2e test โดย:
 * - ใช้ AppModule ตัวเดียวกับตัวจริง (guard/pipe/interceptor/filter ของจริงทุกชั้น)
 * - เปลี่ยน PrismaService เป็น fake in-memory — ไม่ต่อฐานข้อมูลจริงเด็ดขาด
 * - คัดลอก setup จาก src/main.ts มา "ทุกบรรทัด" (ห้ามแก้ main.ts)
 */
export async function createTestApp(fake: object): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(fake)
    .compile();

  const app = moduleFixture.createNestApplication();

  // ---- คัดลอกมาจาก src/main.ts (ห้ามแก้ main.ts — ถ้าต้องแก้ให้ถามผู้ใช้ก่อน) ----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix('api/v1');
  // ---- จบส่วนที่คัดลอก ----

  await app.init();
  return app;
}
