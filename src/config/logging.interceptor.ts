import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction, response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, headers, body } = req;
    const start = Date.now();

    const sanitizedHeaders = { ...headers };
    if (sanitizedHeaders.authorization) {
      sanitizedHeaders.authorization = '***SECRET***';
    }

    const sanitizedBody = { ...body };
    if (sanitizedBody.password || sanitizedBody.newPassword || sanitizedBody.currentPassword){
        sanitizedBody.password='***SECRET***',
        sanitizedBody.newPassword='***SECRET***',
        sanitizedBody.currentPassword='***SECRET***'


    }
  
    const requestLog = {
      method,
      originalUrl,
      headers: sanitizedHeaders,
      body: sanitizedBody,
    };

    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);
    const chunks: Buffer[] = [];

    res.write = (chunk: any) => {
      chunks.push(Buffer.from(chunk));
      return originalWrite(chunk);
    };

    res.end = (chunk: any) => {
      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }
      const responseBody = Buffer.concat(chunks).toString('utf8');
      res.locals.responseBody = responseBody; 
      return originalEnd(chunk); 
    };

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const responseBody = res.locals.responseBody || '';

      const responseLog = {
        statusCode,
        headers: res.getHeaders(),
        body: responseBody.length > 500 ? responseBody.substring(0, 500) + '...' : responseBody,
      };

      if (statusCode >= 400) {
        this.logger.error({
          message: `HTTP ${statusCode} Error`,
          request: requestLog,
          response: responseLog,
          duration: `${duration}ms`,
        });
      } else if (duration > 2000) {
        this.logger.warn(`Slow response: ${duration}ms for ${method} ${originalUrl}`);
      } else {
        this.logger.debug({
          request: requestLog,
          response: responseLog,
          duration: `${duration}ms`,
        });
      }
    });

    next();
  }
}
