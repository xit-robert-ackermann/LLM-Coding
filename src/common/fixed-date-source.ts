import { DateSource } from './date-source.interface';

export class FixedDateSource implements DateSource {
  constructor(private readonly date: Date) {}

  today(): Date {
    return this.date;
  }
}
