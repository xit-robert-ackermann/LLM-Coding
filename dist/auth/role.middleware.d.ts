import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class RoleMiddleware implements NestMiddleware {
    use(req: Request & {
        rolle?: string;
    }, res: Response, next: NextFunction): void;
}
