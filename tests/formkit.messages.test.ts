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
 *
 * zod 4.6 kept `issue.input` but made `safeParse` finalise its issues lazily (on the first
 * `.error` read), so probes below read `.error` while their capturing map is installed.
 */

async function errorFor(field: any, value: any, locale: 'ja' | 'en' = 'ja') {
  const {resolver} = useFormKitValidations({f: field} as any, locale);
  const result: any = await resolver({values: {f: value}, name: undefined});
  const v: any = result.errors?.f;
  return (Array.isArray(v) ? v[0]?.message : v?.message) ?? undefined;
}

describe('the Zod issue shape this depends on (pinned to zod 4.6.6)', () => {
  /** Run `fn` with a capturing global error map installed, restoring the previous one. */
  function capture(fn: () => void): any[] {
    const captured: any[] = [];
    const prev = (z as any).getErrorMap?.();
    (z as any).setErrorMap((issue: any) => {
      captured.push(issue);
      return {message: 'x'};
    });
    try {
      fn();
    } finally {
      (z as any).setErrorMap(prev);
    }
    return captured;
  }

  it('Zod exposes the offending value as `issue.input`, not `issue.received`', () => {
    // `.error` must be read inside the capture: see the lazy-finalisation test below.
    const [issue] = capture(() => void z.array(z.any()).safeParse(undefined).error);

    expect(issue).toBeDefined();
    expect(issue.code).toBe('invalid_type');
    expect(issue.expected).toBe('array');
    // If a future Zod restores `received`, the helper still prefers it — but `input` is
    // what this version provides, and losing it would silently break the messages.
    // A missing value is `input: undefined` with the key present, which is why the
    // library tests it with `in`, not truthiness.
    expect('input' in issue).toBe(true);
    expect(issue.input).toBeUndefined();
    expect('received' in issue).toBe(false);
    // 4.6 shape: `schema` (the owning schema) joined `expected/code/input/inst`.
    expect(Object.keys(issue).sort()).toEqual(['code', 'expected', 'input', 'inst', 'schema']);
  });

  it('a missing object key carries `input: undefined` too', () => {
    const issues = capture(() => void z.object({f: z.array(z.any())}).safeParse({}).error);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('invalid_type');
    expect(issues[0].path).toEqual(['f']);
    expect('input' in issues[0]).toBe(true);
    expect(issues[0].input).toBeUndefined();
  });

  it('a `null` value is `input: null`, and union/enum issues carry `input` as well', () => {
    const [typeIssue] = capture(() => void z.array(z.any()).safeParse(null).error);
    expect(typeIssue.input).toBeNull();

    const union = capture(() => void z.union([z.string(), z.number()]).safeParse(null).error);
    const unionIssue = union.find((i) => i.code === 'invalid_union');
    expect(unionIssue).toBeDefined();
    expect(unionIssue.input).toBeNull();

    // Zod 4 spells the enum/literal mismatch `invalid_value`.
    const [enumIssue] = capture(() => void z.enum(['a', 'b']).safeParse('c').error);
    expect(enumIssue.code).toBe('invalid_value');
    expect(enumIssue.input).toBe('c');
  });

  it('zod 4.6 safeParse finalises issues lazily — the error map runs on the first `.error` read', () => {
    // Up to 4.1.x the error map ran inside safeParse. From 4.6 the error (and therefore
    // every message) is built on first access, under whatever global map is active then.
    // The library is unaffected — zodResolver uses parseAsync, which finalises eagerly,
    // and the per-parse `error` option is consulted before the global map anyway — but a
    // test that only calls safeParse sees no issue at all.
    let result: any;
    const beforeRead = capture(() => {
      result = z.array(z.any()).safeParse(undefined);
    });
    expect(beforeRead).toHaveLength(0);
    expect(result.success).toBe(false);

    const duringRead = capture(() => void result.error);
    expect(duringRead).toHaveLength(1);
  });

  it('parseAsync (what zodResolver calls) still finalises eagerly', async () => {
    const captured: any[] = [];
    const prev = (z as any).getErrorMap?.();
    (z as any).setErrorMap((issue: any) => {
      captured.push(issue);
      return {message: 'x'};
    });
    try {
      await z.array(z.any()).parseAsync(undefined).catch(() => undefined);
    } finally {
      (z as any).setErrorMap(prev);
    }
    expect(captured).toHaveLength(1);
  });
});

describe('Japanese messages are the same as in 0.2.1 (missing value reads as "required")', () => {
  // Literal strings, not `messages.ja.*`, so a change in either the locale file or the
  // Zod issue shape shows up here as a wording change.
  // Baseline: these literals come from the 0.2.1 locale file and the CHANGELOG rule
  // 'A missing value now reads as "required"', which is what 0.2.1 produced on zod 4.1.11.
  // They were not re-measured against an installed zod 4.1.11 (only 4.6.6 is installed);
  // this block pins that behaviour as a regression check on the current zod.
  const missing: Array<[string, any, any]> = [
    ['InputText ""', {as: 'InputText', schema: 'required'}, ''],
    ['InputText undefined', {as: 'InputText', schema: 'required'}, undefined],
    ['InputText null', {as: 'InputText', schema: 'required'}, null],
    ['InputNumber null', {as: 'InputNumber', schema: 'required'}, null],
    ['InputNumber ""', {as: 'InputNumber', schema: 'required'}, ''],
    ['DatePicker undefined', {as: 'DatePicker', schema: 'required'}, undefined],
    ['MultiSelect undefined', {as: 'MultiSelect', options: [], schema: 'required'}, undefined],
    ['MultiSelect []', {as: 'MultiSelect', options: [], schema: 'required'}, []],
    ['Select (strings) null', {as: 'Select', options: [{label: 'A', value: 'a'}], schema: 'required'}, null],
  ];

  for (const [name, field, value] of missing) {
    it(`missing required value — ${name} — says 必須項目です`, async () => {
      expect(await errorFor(field, value)).toBe('必須項目です');
    });
  }

  it('wrong-type value on an array field says 無効な入力です（配列が必要です）', async () => {
    expect(await errorFor({as: 'MultiSelect', options: [], schema: 'required'}, 123))
      .toBe('無効な入力です（配列が必要です）');
    expect(await errorFor({as: 'CheckboxGroup', options: [], schema: 'required'}, true))
      .toBe('無効な入力です（配列が必要です）');
  });

  it('wrong-type value on a number field says 数値を入力してください', async () => {
    expect(await errorFor({as: 'InputNumber', schema: 'required'}, 'abc')).toBe('数値を入力してください');
  });

  it('wrong-type value on a date field says 日付を選択してください', async () => {
    expect(await errorFor({as: 'DatePicker', schema: 'required'}, 'not a date')).toBe('日付を選択してください');
  });

  it('wrong-type value on a text field says 無効な入力です（文字列が必要です）', async () => {
    // A bare / InputText `required` field is `z.string().min(1)`, so a boolean is an
    // invalid_type issue with `input: true` — a type mismatch, not a missing value.
    expect(await errorFor({schema: 'required'}, true)).toBe('無効な入力です（文字列が必要です）');
    expect(await errorFor({as: 'InputText', schema: 'required'}, 42)).toBe('無効な入力です（文字列が必要です）');
  });

  it('a value outside a string Select’s options says 有効な選択肢を選んでください', async () => {
    expect(await errorFor({as: 'Select', options: [{label: 'A', value: 'a'}], schema: 'required'}, 'z'))
      .toBe('有効な選択肢を選んでください');
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
