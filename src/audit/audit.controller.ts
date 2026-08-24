import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RequireRole } from '../auth/require-role.decorator';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequireRole('thekendienst', 'wart')
  findAll(
    @Query('von') von?: string,
    @Query('bis') bis?: string,
    @Query('gegenstandId') gegenstandId?: string,
  ) {
    return this.auditService.auditAbfragen({ von, bis, gegenstandId });
  }
}
