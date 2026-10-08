import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

export interface BusinessExceptionOptions {
  errorCode: string;
  statusCode?: number;
  message?: string;
  params?: Record<string, unknown>;
}

export class BusinessException extends HttpException {
  public readonly errorCode: string;
  public readonly params?: Record<string, unknown>;

  constructor(options: BusinessExceptionOptions) {
    const statusCode = options.statusCode ?? HttpStatus.UNPROCESSABLE_ENTITY;
    super(
      {
        errorCode: options.errorCode,
        message: options.message,
        params: options.params,
      },
      statusCode,
    );
    this.errorCode = options.errorCode;
    this.params = options.params;
  }
}

interface ErrorResponseBody {
  errorCode?: string;
  error?: string;
  message?: string | string[];
  params?: Record<string, unknown>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let params: Record<string, unknown> | undefined;

    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      errorCode = exception.errorCode;
      params = exception.params;
      const res = exception.getResponse() as ErrorResponseBody;
      message =
        (typeof res.message === 'string' ? res.message : undefined) ??
        exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const body = res as ErrorResponseBody;
        errorCode =
          body.errorCode ??
          body.error ??
          (status === 404
            ? 'NOT_FOUND'
            : status === 403
              ? 'FORBIDDEN'
              : status === 401
                ? 'UNAUTHORIZED'
                : 'HTTP_ERROR');

        if (Array.isArray(body.message)) {
          message = body.message.join(', ');
        } else if (typeof body.message === 'string') {
          message = body.message;
        } else {
          message = exception.message;
        }
        params = body.params;
      } else {
        message = String(res);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(
        `Prisma error [${exception.code}]: ${exception.message}`,
      );
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        errorCode = 'UNIQUE_CONSTRAINT_FAILED';
        message = 'ข้อมูลซ้ำกับที่มีอยู่ในระบบ';
        params = { target: exception.meta?.target };
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        errorCode = 'NOT_FOUND';
        message = 'ไม่พบข้อมูลที่ระบุในระบบ';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        errorCode = 'FOREIGN_KEY_CONSTRAINT_FAILED';
        message = 'ไม่สามารถดำเนินการได้เนื่องจากมีข้อมูลอื่นเชื่อมโยงอยู่';
        params = { field: exception.meta?.field_name };
      } else {
        status = HttpStatus.BAD_REQUEST;
        errorCode = `DB_ERROR_${exception.code}`;
        message = 'เกิดข้อผิดพลาดในการประมวลผลข้อมูลฐานข้อมูล';
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception.message;
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const padMs = (n: number) => n.toString().padStart(3, '0');
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const bkkDate = new Date(utcTime + 7 * 3600000);
    const timestamp = `${bkkDate.getFullYear()}-${pad(bkkDate.getMonth() + 1)}-${pad(bkkDate.getDate())}T${pad(bkkDate.getHours())}:${pad(bkkDate.getMinutes())}:${pad(bkkDate.getSeconds())}.${padMs(bkkDate.getMilliseconds())}+07:00`;

    const statusNameMap: Record<number, string> = {
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
    const errorType = statusNameMap[status] ?? 'HTTP_ERROR';

    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      error: errorType,
      message,
      ...(params ? { params } : {}),
      timestamp,
    });
  }
}
