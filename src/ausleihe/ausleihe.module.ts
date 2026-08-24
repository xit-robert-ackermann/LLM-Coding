import { Module } from '@nestjs/common';
import { AusleiheController } from './ausleihe.controller';
import { AusleiheService } from './ausleihe.service';

@Module({
  controllers: [AusleiheController],
  providers: [AusleiheService],
  exports: [AusleiheService],
})
export class AusleiheModule {}
