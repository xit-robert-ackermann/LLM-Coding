import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { KatalogService } from './katalog.service';
import { RequireRole } from '../auth/require-role.decorator';

@Controller('gegenstaende')
export class GegenstandController {
  constructor(private readonly service: KatalogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireRole('thekendienst')
  create(@Body() body: any) {
    return this.service.gegenstandAnlegen(body);
  }

  @Get()
  @RequireRole('mitglied', 'thekendienst', 'wart')
  findAll(@Query('kategorieId') kategorieId?: string, @Query('status') status?: string) {
    return this.service.gegenstaendeAbfragen({ kategorieId, status });
  }

  @Get(':inventarnummer/zustandswechsel')
  @RequireRole('thekendienst', 'wart')
  findZustandswechsel(@Param('inventarnummer') inventarnummer: string) {
    return this.service.zustandswechselAbfragen(inventarnummer);
  }

  @Get(':inventarnummer')
  @RequireRole('mitglied', 'thekendienst', 'wart')
  findOne(@Param('inventarnummer') inventarnummer: string) {
    return this.service.gegenstandAbfragen(inventarnummer);
  }
}
