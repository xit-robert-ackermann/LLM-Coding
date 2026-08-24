import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { KatalogService } from './katalog.service';
import { RequireRole } from '../auth/require-role.decorator';

@Controller('kategorien')
export class KategorieController {
  constructor(private readonly service: KatalogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireRole('thekendienst')
  create(@Body() body: any) {
    return this.service.kategorieAnlegen(body);
  }

  @Get()
  @RequireRole('mitglied', 'thekendienst', 'wart')
  findAll() {
    return this.service.kategorienAbfragen();
  }
}
