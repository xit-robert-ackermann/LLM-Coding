import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './require-role.decorator';
import { Request } from 'express';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { rolle?: string }>();
    if (!request.rolle || !requiredRoles.includes(request.rolle)) {
      throw new ForbiddenException({
        fehlercode: 'ROLLE_UNGUELTIG',
        nachricht: 'Fehlende Berechtigung für diese Operation.',
        details: {},
      });
    }
    return true;
  }
}
