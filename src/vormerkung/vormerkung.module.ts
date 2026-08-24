import { Module } from '@nestjs/common';
import { VormerkungController } from './vormerkung.controller';
import { VormerkungService } from './vormerkung.service';

@Module({
  controllers: [VormerkungController],
  providers: [VormerkungService],
  exports: [VormerkungService],
})
export class VormerkungModule {}
