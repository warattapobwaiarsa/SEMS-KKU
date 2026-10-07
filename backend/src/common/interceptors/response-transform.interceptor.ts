import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * ครอบ (wrap) ผลลัพธ์ที่สำเร็จทุกตัว ให้อยู่ในรูป Envelope มาตรฐาน
 * ตาม REST API spec หัวข้อ 2.2:
 *
 *   { "success": true, "statusCode": 200, "data": { ... } }
 *
 * กรณี handler คืนผลลัพธ์แบบแบ่งหน้า (Pagination) คือคืน object รูปแบบ
 * { data: [...], meta: { page, limit, total, totalPages } }
 * ให้ยก `meta` ขึ้นมาไว้ระดับบนของ envelope ด้วย เช่น
 *
 *   { "success": true, "statusCode": 200, "data": [...],
 *     "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 } }
 *
 * ข้อผิดพลาด (error) ไม่ผ่าน interceptor นี้ — ดูที่ GlobalExceptionFilter แทน
 */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // ดึง HTTP status ของ response ปัจจุบัน (ปกติคือ 200) มาใส่ใน envelope
    const httpResponse = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data: unknown) => {
        const isPaginatedResult =
          data !== null &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data;

        if (isPaginatedResult) {
          const paginatedResult = data;
          return {
            success: true,
            statusCode: httpResponse.statusCode,
            data: paginatedResult.data,
            meta: paginatedResult.meta,
          };
        }

        // กรณีทั่วไป: ครอบข้อมูลที่ handler คืนมาทั้งหมดไว้ใน `data`
        return {
          success: true,
          statusCode: httpResponse.statusCode,
          data,
        };
      }),
    );
  }
}
