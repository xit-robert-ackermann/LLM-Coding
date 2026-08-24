import { Module } from '@nestjs/common';
import { AusleiheController } from './ausleihe.controller';
import { PruefungenController } from './pruefungen.controller';
import { AusleiheService } from './ausleihe.service';
import { VormerkungModule } from '../vormerkung/vormerkung.module';

@Module({
  imports: [VormerkungModule],
  controllers: [AusleiheController, PruefungenController],
  providers: [AusleiheService],
  exports: [AusleiheService],
})
export class AusleiheModule {}
