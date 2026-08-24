import { DateSource } from './date-source.interface';
export declare class FixedDateSource implements DateSource {
    private readonly date;
    constructor(date: Date);
    today(): Date;
}
