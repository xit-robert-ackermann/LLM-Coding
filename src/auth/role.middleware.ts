import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const VALID_ROLES = ['mitglied', 'thekendienst', 'wart'];

@Injectable()
export class RoleMiddleware implements NestMiddleware {
  use(req: Request & { rolle?: string }, res: Response, next: NextFunction): void {
    if (req.path === '/health') { next(); return; }
    const rolle = req.headers['x-rolle'] as string | undefined;
    if (!rolle || !VALID_ROLES.includes(rolle)) {
      res.status(401).json({
        fehlercode: 'ROLLE_UNGUELTIG',
        nachricht: 'X-Rolle Header fehlt oder enthält einen ungültigen Wert.',
        details: {},
      });
      return;
    }
    req.rolle = rolle;
    next();
  }
}
