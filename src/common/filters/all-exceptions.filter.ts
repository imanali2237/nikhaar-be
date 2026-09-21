import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
  method: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error, errors } = this.parseException(exception);

    const body: ApiErrorResponse = {
      success: false,
      statusCode,
      error,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    this.logger.error(
      `${request.method} ${request.url} -> ${statusCode}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(statusCode).json(body);
  }

  private parseException(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
    errors?: string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const httpResponse = exception.getResponse();

      if (typeof httpResponse === 'string') {
        return { statusCode: status, message: httpResponse, error: exception.name };
      }

      const { message, error } = httpResponse as {
        message?: string | string[];
        error?: string;
      };

      // ValidationPipe (class-validator) returns `message` as string[]
      if (Array.isArray(message)) {
        return {
          statusCode: status,
          message: message[0] ?? exception.message,
          error: error ?? 'Bad Request',
          errors: message,
        };
      }

      return {
        statusCode: status,
        message: message ?? exception.message,
        error: error ?? exception.name,
      };
    }

    // Unrecognized/unhandled errors — never leak internals to REST clients
    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: this.isProduction ? 'Internal server error' : exception.message,
        error: exception.name || 'InternalServerError',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
    };
  }
}
