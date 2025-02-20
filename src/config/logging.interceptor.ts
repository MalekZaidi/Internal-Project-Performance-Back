import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, headers, body } = req;
    const start = Date.now();
    const requestLog = {
      method,
      originalUrl,
      headers,
      body,
    };

    // Store the original response.write and response.end functions
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    // Store response body in res.locals
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
      res.write = originalWrite; 
      res.end = originalEnd; 
      return originalEnd(chunk); 
    };

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const responseBody = res.locals.responseBody; // Access the response body stored in res.locals
      const responseLog = {
        statusCode,
        headers: res.getHeaders(),
        body: responseBody,
      };
      this.logger.log({
        request: requestLog,
        response: responseLog,
        duration: `${duration}ms`,
      });
    });

    next();
  }
}