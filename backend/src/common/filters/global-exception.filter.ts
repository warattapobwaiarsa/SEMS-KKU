import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException } from '../exceptions/app.exception';

/**
 * แผนที่ HTTP status -> รหัส error แบบระบบ ("ระบบ" ในตาราง spec หัวข้อ 2.3)
 * ใช้ทั้งเป็น errorCode เริ่มต้นเมื่อไม่มีรหัสเฉพาะ และเป็นค่าของฟิลด์ `error`
 * (ชื่อ semantic ของ HTTP status ตามตัวอย่างใน spec หัวข้อ 2.2)
 */
const STATUS_TO_ERROR_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  410: 'GONE',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
};

/**
 * สร้าง timestamp ในเขตเวลาไทย (+07:00) ตามรูปแบบใน spec หัวข้อ 2.2 เช่น
 * 2026-10-06T13:55:00.000+07:00
 * ประเทศไทยไม่มีเวลาออมแสง (DST) จึงบวก 7 ชั่วโมงจาก UTC ได้ตรงเสมอ
 */
function toBangkokTimestamp(): string {
  const bangkokTime = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return bangkokTime.toISOString().slice(0, 23) + '+07:00';
}

/**
 * จับ error ทุกชนิดที่เกิดขึ้นในระบบ แล้วแปลงให้เป็น error envelope
 * ตาม REST API spec หัวข้อ 2.2:
 *
 *   { "success": false, "statusCode": 422, "errorCode": "...",
 *     "error": "UNPROCESSABLE_ENTITY", "params": { ... }, "timestamp": "..." }
 *
 * - error ที่โยนด้วย AppException จะใช้ errorCode ที่ระบุมากับตัว
 * - error อื่น (เช่นจาก ValidationPipe หรือ HttpException ของ Nest)
 *   จะใช้ errorCode ตาม HTTP status
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<Response>();

    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let params: Record<string, unknown> | undefined;

    if (exception instanceof AppException) {
      // กรณีโยนเองด้วย AppException: ใช้รหัสและ params ที่ระบุมา
      statusCode = exception.getStatus();
      errorCode = exception.errorCode;
      params = exception.params;
    } else if (exception instanceof HttpException) {
      // กรณีเป็น HttpException ของ Nest (เช่นจาก ValidationPipe)
      statusCode = exception.getStatus();
      const semanticErrorName =
        STATUS_TO_ERROR_CODE[statusCode] ?? 'HTTP_ERROR';
      errorCode = semanticErrorName;

      // ValidationPipe (whitelist/forbidNonWhitelisted) โยน BadRequestException
      // พร้อมรายการปัญหาในฟิลด์ message — ส่งต่อไปที่ params เพื่อให้ debug ง่าย
      if (statusCode === 400) {
        const exceptionResponse = exception.getResponse();
        if (
          typeof exceptionResponse === 'object' &&
          exceptionResponse !== null &&
          'message' in exceptionResponse
        ) {
          const validationMessages = exceptionResponse.message;
          params = { messages: validationMessages };
        }
      }
    }

    // error ที่ไม่คาดคิด (ไม่ใช่ AppException) ให้ log ไว้หาสาเหตุตอน debug
    // ส่วน error ที่โยนเองถือว่า "คาดหมายไว้แล้ว" จึงไม่ต้อง log
    if (!(exception instanceof AppException)) {
      console.error('[Unexpected error]', exception);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      errorCode,
      error: STATUS_TO_ERROR_CODE[statusCode] ?? 'HTTP_ERROR',
      params,
      timestamp: toBangkokTimestamp(),
    });
  }
}
