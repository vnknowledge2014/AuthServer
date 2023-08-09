import {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class CustomErrorFilter implements ExceptionFilter {
  catch(err: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status = 500;
    let msg = err.message || 'Internal server error';
    let error = 'Error';

    if (err instanceof HttpException) {
      status = err.getStatus();
      msg = err.getResponse()['message'] || err.getResponse();
      error = err.getResponse()['error'];
    }

    response.status(status).json({
      code: status,
      msg,
      error,
    });
  }
}
