import { SystemDateSource } from './system-date-source';
import { FixedDateSource } from './fixed-date-source';

describe('SystemDateSource', () => {
  it('returns a date close to today', () => {
    const ds = new SystemDateSource();
    const result = ds.today();
    const now = new Date();
    const diff = Math.abs(result.getTime() - now.getTime());
    expect(diff).toBeLessThan(1000);
  });
});

describe('FixedDateSource', () => {
  it('always returns the fixed date', () => {
    const fixed = new Date('2024-03-15');
    const ds = new FixedDateSource(fixed);
    expect(ds.today()).toEqual(fixed);
    expect(ds.today()).toEqual(fixed);
  });
});
