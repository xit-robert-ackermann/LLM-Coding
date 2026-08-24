import { Module } from '@nestjs/common';
import { PruefungService } from './pruefung.service';
import { VormerkungModule } from '../vormerkung/vormerkung.module';

@Module({
  imports: [VormerkungModule],
  providers: [PruefungService],
  exports: [PruefungService],
})
export class PruefungModule {}
