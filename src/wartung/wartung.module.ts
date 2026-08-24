import { Module } from '@nestjs/common';
import { WartungService } from './wartung.service';
import { VormerkungModule } from '../vormerkung/vormerkung.module';

@Module({
  imports: [VormerkungModule],
  providers: [WartungService],
  exports: [WartungService],
})
export class WartungModule {}
