import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { KatalogService } from './katalog.service';
import { RequireRole } from '../auth/require-role.decorator';

@Controller('mitglieder')
export class MitgliedController {
  constructor(private readonly service: KatalogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireRole('thekendienst')
  create(@Body() body: any) {
    return this.service.mitgliedAnlegen(body);
  }

  @Get(':id')
  @RequireRole('thekendienst')
  findOne(@Param('id') id: string) {
    return this.service.mitgliedAbfragen(id);
  }
}
