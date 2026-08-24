import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AusleiheService } from './ausleihe.service';
import { VormerkungService } from '../vormerkung/vormerkung.service';
import { RequireRole } from '../auth/require-role.decorator';

@Controller('ausleihen')
export class AusleiheController {
  constructor(
    private readonly service: AusleiheService,
    private readonly vormerkungService: VormerkungService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireRole('thekendienst')
  create(@Body() body: any) {
    this.vormerkungService.verfalleneReservierungenBereinigen();
    return this.service.ausgeben(body);
  }

  @Get()
  @RequireRole('thekendienst')
  findAll(
    @Query('status') status?: string,
    @Query('mitgliedId') mitgliedId?: string,
    @Query('ueberfaellig') ueberfaellig?: string,
  ) {
    return this.service.ausleihenAbfragen({
      status,
      mitgliedId,
      ueberfaellig: ueberfaellig === 'true',
    });
  }

  @Get(':id/kautionsbewegungen')
  @RequireRole('thekendienst', 'wart')
  findKautionsbewegungen(@Param('id') id: string) {
    return this.service.kautionsbewegungenAbfragen(id);
  }

  @Get(':id')
  @RequireRole('thekendienst', 'wart')
  findOne(@Param('id') id: string) {
    return this.service.ausleiheDetail(id);
  }

  @Post(':id/verlaengern')
  @HttpCode(HttpStatus.OK)
  @RequireRole('thekendienst')
  verlaengern(@Param('id') id: string) {
    return this.service.verlaengern(id);
  }

  @Post(':id/rueckgabe')
  @HttpCode(HttpStatus.OK)
  @RequireRole('thekendienst')
  rueckgabe(@Param('id') id: string, @Body() body: any) {
    return this.service.rueckgabeEntgegennehmen(id, body?.auffaelligkeiten);
  }
}
