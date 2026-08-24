import { Injectable } from '@nestjs/common';
import { DateSource } from './date-source.interface';

@Injectable()
export class SystemDateSource implements DateSource {
  today(): Date {
    return new Date();
  }
}
