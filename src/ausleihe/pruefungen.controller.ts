import { Controller, Get } from '@nestjs/common';
import { AusleiheService } from './ausleihe.service';
import { RequireRole } from '../auth/require-role.decorator';

@Controller('pruefungen')
export class PruefungenController {
  constructor(private readonly ausleiheService: AusleiheService) {}

  @Get()
  @RequireRole('wart', 'thekendienst')
  findAll() {
    return this.ausleiheService.pruefungsarbeitsliste();
  }
}
