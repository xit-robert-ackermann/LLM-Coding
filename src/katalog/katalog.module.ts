import { Module } from '@nestjs/common';
import { KategorieController } from './kategorie.controller';
import { GegenstandController } from './gegenstand.controller';
import { MitgliedController } from './mitglied.controller';
import { KatalogService } from './katalog.service';

@Module({
  controllers: [KategorieController, GegenstandController, MitgliedController],
  providers: [KatalogService],
  exports: [KatalogService],
})
export class KatalogModule {}
