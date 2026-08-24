import { Module } from '@nestjs/common';
import { EinweisungService } from './einweisung.service';

@Module({
  providers: [EinweisungService],
  exports: [EinweisungService],
})
export class EinweisungModule {}
