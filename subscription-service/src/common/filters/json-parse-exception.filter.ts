import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

interface BodyParserSyntaxError extends SyntaxError {
  status?: number;
  type?: string;
  body?: string;
}

@Catch(SyntaxError)
export class JsonParseExceptionFilter implements ExceptionFilter {
  catch(exception: BodyParserSyntaxError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isBodyParserError =
      exception?.status === HttpStatus.BAD_REQUEST &&
      exception?.type === 'entity.parse.failed';

    if (!isBodyParserError) {
      throw exception;
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message:
        'Invalid JSON payload. Ensure strings are wrapped in double quotes and numbers do not contain leading zeros.',
      details: exception.message,
      path: request.url,
    });
  }
}

