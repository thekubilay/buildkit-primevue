import {z} from 'zod';
import useFormKitValidations from '../src/components/formkit/useFormKitValidations';
import {messages} from '../src/components/formkit/locales/messages';

/**
 * A missing value must read as "this field is required", not as a type mismatch.
 *
 * Zod 3 exposed the offending type as `issue.received`; Zod 4 removed that field and
 * carries the value itself as `issue.input`. Reading only `received` left the
 * missing-value branch of the custom error map dead, so an empty required field reported
 * 「無効な入力です（〇〇が必要です）」 instead.
 */

async function errorFor(field: any, value: any, locale: 'ja' | 'en' = 'ja') {
  const {resolver} = useFormKitValidations({f: field} as any, locale);
  const result: any = await resolver({values: {f: value}, name: undefined});
  const v: any = result.errors?.f;
  return (Array.isArray(v) ? v[0]?.message : v?.message) ?? undefined;
}

describe('the Zod issue shape this depends on', () => {
  it('Zod exposes the offending value as `issue.input`, not `issue.received`', () => {
    let captured: any = null;
    const prev = (z as any).getErrorMap?.();
    (z as any).setErrorMap((issue: any) => {
      captured = issue;
      return {message: 'x'};
    });
    z.array(z.any()).safeParse(undefined);
    (z as any).setErrorMap(prev);

    expect(captured).not.toBeNull();
    expect(captured.code).toBe('invalid_type');
    // If a future Zod restores `received`, the helper still prefers it — but `input` is
    // what this version provides, and losing it would silently break the messages.
    expect('input' in captured).toBe(true);
  });
});

describe('a missing required value reports the required message', () => {
  const cases: Array<[string, any, any]> = [
    ['InputText', {as: 'InputText', schema: 'required'}, ''],
    ['Textarea', {as: 'Textarea', schema: 'required'}, ''],
    ['no `as`', {schema: 'required'}, ''],
    ['InputNumber', {as: 'InputNumber', schema: 'required'}, null],
    ['InputNumber (undefined)', {as: 'InputNumber', schema: 'required'}, undefined],
    ['DatePicker', {as: 'DatePicker', schema: 'required'}, null],
    ['MultiSelect', {as: 'MultiSelect', options: [], schema: 'required'}, ''],
    ['MultiSelect (null)', {as: 'MultiSelect', options: [], schema: 'required'}, null],
    ['CheckboxGroup', {as: 'CheckboxGroup', options: [], schema: 'required'}, ''],
  ];

  for (const [name, field, value] of cases) {
    it(`${name} says 必須項目です`, async () => {
      expect(await errorFor(field, value)).toBe(messages.ja.required);
    });
  }

  it('and the English locale says so too', async () => {
    expect(await errorFor({as: 'MultiSelect', options: [], schema: 'required'}, '', 'en'))
      .toBe(messages.en.required);
  });

  it('no message still leaks the raw Zod English text', async () => {
    const msg = await errorFor({as: 'MultiSelect', options: [], schema: 'required'}, null);
    expect(msg).not.toMatch(/Invalid input|expected|received/i);
  });
});

describe('Select branches all report a blank value as missing', () => {
  // createSelectSchema picks a different Zod shape per option-value type. The mixed-type
  // branch has no base type-check before its refine, so a blank value used to be reported
  // as an invalid choice rather than as missing.
  const optionSets: Array<[string, Array<{label: string; value: any}>]> = [
    ['all strings', [{label: 'A', value: 'a'}, {label: 'B', value: 'b'}]],
    ['all numbers', [{label: 'A', value: 1}, {label: 'B', value: 2}]],
    ['all booleans', [{label: 'Y', value: true}, {label: 'N', value: false}]],
    ['mixed types', [{label: 'A', value: 'a'}, {label: 'One', value: 1}]],
    ['no options', []],
  ];

  for (const [name, options] of optionSets) {
    for (const empty of [undefined, null, '']) {
      it(`${name}, value ${JSON.stringify(empty)} says 必須項目です`, async () => {
        const msg = await errorFor({as: 'Select', options, schema: 'required'}, empty);
        expect(msg).toBe(messages.ja.required);
      });
    }
  }

  it('a value outside the options is still reported as an invalid choice', async () => {
    const msg = await errorFor(
      {as: 'Select', options: [{label: 'A', value: 'a'}, {label: 'One', value: 1}], schema: 'required'},
      'nope',
    );
    expect(msg).toBeDefined();
    expect(msg).not.toBe(messages.ja.required);
  });

  it('a valid choice passes on every branch', async () => {
    expect(await errorFor({as: 'Select', options: [{label: 'A', value: 'a'}], schema: 'required'}, 'a')).toBeUndefined();
    expect(await errorFor({as: 'Select', options: [{label: 'A', value: 1}], schema: 'required'}, 1)).toBeUndefined();
    expect(await errorFor({as: 'Select', options: [{label: 'A', value: 'a'}, {label: 'One', value: 1}], schema: 'required'}, 1)).toBeUndefined();
  });
});

describe('a WRONG-TYPE value still reports the type message, not "required"', () => {
  it('an array field given a number', async () => {
    const msg = await errorFor({as: 'MultiSelect', options: [], schema: 'required'}, 123);
    expect(msg).toBe(messages.ja.invalidType(messages.ja.typeLabels.array ?? 'array'));
    expect(msg).not.toBe(messages.ja.required);
  });

  it('a number field given a non-numeric string', async () => {
    const msg = await errorFor({as: 'InputNumber', schema: 'required'}, 'abc');
    expect(msg).toBeDefined();
    expect(msg).not.toBe(messages.ja.required);
  });
});

describe('valid values produce no message at all', () => {
  it('filled required fields pass', async () => {
    expect(await errorFor({as: 'InputText', schema: 'required'}, 'ok')).toBeUndefined();
    expect(await errorFor({as: 'InputNumber', schema: 'required'}, 5)).toBeUndefined();
    expect(await errorFor({as: 'MultiSelect', options: [], schema: 'required'}, ['a'])).toBeUndefined();
  });
});
