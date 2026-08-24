import { Controller, Post, Delete, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { VormerkungService } from './vormerkung.service';
import { RequireRole } from '../auth/require-role.decorator';

@Controller()
export class VormerkungController {
  constructor(private readonly service: VormerkungService) {}

  @Post('vormerkungen')
  @HttpCode(HttpStatus.CREATED)
  @RequireRole('mitglied', 'thekendienst')
  create(@Body() body: any) {
    return this.service.vormerken(body);
  }

  @Delete('vormerkungen/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRole('mitglied', 'thekendienst')
  stornieren(@Param('id') id: string) {
    this.service.stornieren(id);
  }

  @Delete('reservierungen/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRole('mitglied', 'thekendienst')
  reservierungStornieren(@Param('id') id: string) {
    this.service.reservierungStornieren(id);
  }

  @Get('vormerkungen')
  @RequireRole('thekendienst', 'mitglied', 'wart')
  findAll(
    @Query('kategorieId') kategorieId?: string,
    @Query('mitgliedId') mitgliedId?: string,
  ) {
    return this.service.vormerkungenAbfragen({ kategorieId, mitgliedId });
  }
}
