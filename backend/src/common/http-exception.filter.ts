import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

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
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const timestamp = new Date().toISOString();

    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      message,
      ...(params ? { params } : {}),
      timestamp,
    });
  }
}
