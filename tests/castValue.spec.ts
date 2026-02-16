import { describe, it, expect } from 'vitest';
import castValue from '../src/components/formkit/utils/castValue.ts';

describe('castValue', () => {
  it('casts ISO date string with microseconds to Date', () => {
    const input = '2023-10-05T05:23:41.036132Z';
    const result = castValue(input);
    expect(result).toBeInstanceOf(Date);
    // Ensure the time is correctly parsed (microseconds truncated to milliseconds: 036)
    expect((result as Date).toISOString()).toBe('2023-10-05T05:23:41.036Z');
  });

  it('casts ISO date string with milliseconds to Date', () => {
    const input = '2023-10-05T05:23:41.123Z';
    const result = castValue(input);
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).toISOString()).toBe('2023-10-05T05:23:41.123Z');
  });

  it('casts boolean-like strings', () => {
    expect(castValue('true')).toBe(true);
    expect(castValue('false')).toBe(false);
    expect(castValue('yes')).toBe(true);
    expect(castValue('no')).toBe(false);
  });

  it('casts number-like strings when as is InputNumber', () => {
    expect(castValue('42', 'InputNumber')).toBe(42);
    expect(castValue('  3.14  ', 'InputNumber')).toBeCloseTo(3.14);
  });

  it('keeps number-like strings as strings without number-like component', () => {
    expect(castValue('42')).toBe('42');
    expect(castValue('  3.14  ')).toBe('  3.14  ');
  });

  it('returns original string for non-date, non-boolean, non-number', () => {
    expect(castValue('hello')).toBe('hello');
  });

  it('returns null for null/undefined', () => {
    expect(castValue(null as any)).toBeNull();
    expect(castValue(undefined as any)).toBeNull();
  });

  it('respects `as` (InputText) and keeps numeric strings as strings', () => {
    expect(castValue('42', 'InputText')).toBe('42');
    expect(castValue(' 007 ', 'InputText')).toBe(' 007 ');
  });
});
