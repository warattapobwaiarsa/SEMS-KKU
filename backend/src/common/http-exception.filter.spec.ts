import { HttpExceptionFilter } from './http-exception.filter';
import { BadRequestException, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BusinessException } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should return BAD_REQUEST as errorCode when Nest ValidationPipe throws BadRequestException', () => {
    // NestJS ValidationPipe throws this structure:
    const exception = new BadRequestException({
      statusCode: 400,
      message: ['property unexpected should not exist'],
      error: 'Bad Request',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 400,
        errorCode: 'BAD_REQUEST',
        error: 'BAD_REQUEST',
        message: 'property unexpected should not exist',
      }),
    );
  });

  it('should preserve custom errorCode for BusinessException', () => {
    const exception = new BusinessException({
      errorCode: 'CRITERIA_SUM_NOT_100',
      statusCode: 422,
      message: 'ผลรวมไม่เท่ากับ 100',
      params: { sum: 90 },
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(422);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 422,
        errorCode: 'CRITERIA_SUM_NOT_100',
        error: 'UNPROCESSABLE_ENTITY',
        message: 'ผลรวมไม่เท่ากับ 100',
        params: { sum: 90 },
      }),
    );
  });
});
