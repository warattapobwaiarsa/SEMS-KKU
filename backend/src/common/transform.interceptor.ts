import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ResponseEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  meta?: unknown;
}

interface CustomResult<T> {
  data: T;
  meta?: unknown;
}

function isCustomResult<T>(val: unknown): val is CustomResult<T> {
  return typeof val === 'object' && val !== null && 'data' in val;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseEnvelope<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseEnvelope<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((res: T) => {
        if (isCustomResult<T>(res)) {
          const envelope: ResponseEnvelope<T> = {
            success: true,
            statusCode,
            data: res.data,
          };
          if (res.meta !== undefined) {
            envelope.meta = res.meta;
          }
          return envelope;
        }

        return {
          success: true,
          statusCode,
          data: res,
        };
      }),
    );
  }
}
