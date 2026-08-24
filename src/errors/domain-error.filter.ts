import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from './domain-error';

@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof DomainError) {
      res.status(exception.httpStatus).json({
        fehlercode: exception.code,
        nachricht: exception.message,
        details: {},
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(
        typeof body === 'object' ? body : { fehlercode: 'HTTP_ERROR', nachricht: String(body), details: {} }
      );
      return;
    }

    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    res.status(500).json({
      fehlercode: 'INTERNER_FEHLER',
      nachricht: 'Ein unerwarteter Fehler ist aufgetreten.',
      details: {},
    });
  }
}
