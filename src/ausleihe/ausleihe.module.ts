import { Module } from '@nestjs/common';
import { AusleiheController } from './ausleihe.controller';
import { AusleiheService } from './ausleihe.service';
import { VormerkungModule } from '../vormerkung/vormerkung.module';

@Module({
  imports: [VormerkungModule],
  controllers: [AusleiheController],
  providers: [AusleiheService],
  exports: [AusleiheService],
})
export class AusleiheModule {}
