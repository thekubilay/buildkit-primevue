import useFormKitValidations from '../src/components/formkit/useFormKitValidations';
import castValue from '../src/components/formkit/utils/castValue';
import {getPayload} from '../src/components/formkit/utils/getPayload';

/**
 * Regression cover for a user report: "マルチセレクトとチェックグループはデフォルトで
 * 必須入力に設定されてしまっています" — optional MultiSelect / CheckboxGroup fields
 * reported 「無効な入力です（配列が必要です）」 without the user ever touching them.
 *
 * Cause: the array branch produced `z.array(z.any()).optional().nullable()`, which accepts
 * undefined / null / [] but NOT "". An empty string is this library's generic "no value"
 * (castValue returns it for a blank CheckboxGroup, clear() resets to it, and backend column
 * configs ship `defaultValue: ""` for every control), so untouched fields failed the type
 * check and looked required.
 */

async function errorsFor(fields: any, values: Record<string, any>, locale: 'ja' | 'en' = 'ja') {
  const {resolver} = useFormKitValidations(fields, locale);
  const result: any = await resolver({values, name: undefined});
  const out: Record<string, string> = {};
  Object.entries(result.errors ?? {}).forEach(([k, v]: [string, any]) => {
    const msg = Array.isArray(v) ? v[0]?.message : v?.message;
    if (msg) out[k] = msg;
  });
  return out;
}

const optionalArrayFields = {
  multi_select: {label: 'マルチセレクト', as: 'MultiSelect', options: [{label: 'A', value: 'a'}]},
  check_group: {label: 'チェックグループ', as: 'CheckboxGroup', options: [{label: 'A', value: 'a'}]},
  typed_array: {label: 'Typed array', type: 'array'},
  by_default: {label: 'Array by defaultValue', defaultValue: []},
} as any;

describe('optional array-like fields accept every "empty" representation', () => {
  const empties: Array<[string, any]> = [
    ['undefined', undefined],
    ['null', null],
    ['empty array', []],
    ['empty string', ''],
    ['whitespace string', '   '],
  ];

  for (const [name, value] of empties) {
    it(`${name} produces no error`, async () => {
      const values = Object.fromEntries(Object.keys(optionalArrayFields).map(k => [k, value]));
      expect(await errorsFor(optionalArrayFields, values)).toEqual({});
    });
  }

  it('a real selection still passes', async () => {
    const values = Object.fromEntries(Object.keys(optionalArrayFields).map(k => [k, ['a']]));
    expect(await errorsFor(optionalArrayFields, values)).toEqual({});
  });
});

describe('required array-like fields still enforce their rules', () => {
  const requiredFields = {
    tags: {
      label: 'Tags', as: 'MultiSelect', schema: 'required|min:2|max:3',
      options: [{label: 'A', value: 'a'}, {label: 'B', value: 'b'}, {label: 'C', value: 'c'}, {label: 'D', value: 'd'}],
    },
    // `required: true` is the label marker only — see formkit.required.test.ts. Enforcement
    // has to come from the schema string.
    picks: {label: 'Picks', as: 'CheckboxGroup', schema: 'required', options: [{label: 'A', value: 'a'}]},
  } as any;

  it('an empty string still blocks submission', async () => {
    const errs = await errorsFor(requiredFields, {tags: '', picks: ''});
    expect(errs.tags).toBeDefined();
    expect(errs.picks).toBeDefined();
  });

  // The message must name the problem the user can act on: the field is empty, not that
  // the wrong type arrived. See formkit.messages.test.ts for the full matrix.
  it('a missing required value says "required", not "an array is expected"', async () => {
    const errs = await errorsFor(requiredFields, {tags: '', picks: ''});
    expect(errs.tags).not.toContain('配列');
    expect(errs.picks).not.toContain('配列');
  });

  it('an empty array fails a schema-required array field', async () => {
    const errs = await errorsFor(requiredFields, {tags: [], picks: []});
    expect(errs.tags).toBeDefined();
    expect(errs.picks).toBeDefined();
  });

  it('min:2 is still enforced — the preprocess wrapper did not swallow the rules', async () => {
    const errs = await errorsFor(requiredFields, {tags: ['a'], picks: ['a']});
    expect(errs.tags).toBeDefined();
    expect(errs.picks).toBeUndefined();
  });

  it('max:3 is still enforced', async () => {
    const errs = await errorsFor(requiredFields, {tags: ['a', 'b', 'c', 'd'], picks: ['a']});
    expect(errs.tags).toBeDefined();
  });

  it('a valid selection passes every rule', async () => {
    expect(await errorsFor(requiredFields, {tags: ['a', 'b'], picks: ['a']})).toEqual({});
  });
});

describe('non-array fields are unaffected by the empty-string coercion', () => {
  const fields = {
    text: {label: 'Text', as: 'InputText'},
    select: {label: 'Select', as: 'Select', options: [{label: 'A', value: 'a'}]},
    area: {label: 'Area', as: 'Textarea'},
    num: {label: 'Number', as: 'InputNumber'},
    req_text: {label: 'Required text', schema: 'required'},
  } as any;

  it('optional string fields still accept an empty string', async () => {
    const errs = await errorsFor(fields, {text: '', select: '', area: '', num: '', req_text: 'ok'});
    expect(errs).toEqual({});
  });

  it('a required string field still rejects an empty string', async () => {
    const errs = await errorsFor(fields, {text: '', select: '', area: '', num: '', req_text: ''});
    expect(errs.req_text).toBeDefined();
  });
});

describe('array-valued controls cast and submit consistently', () => {
  // Unblocking submission made a latent mismatch reachable: castValue used to coerce only
  // MultiSelect to an array, so an untouched CheckboxGroup would ship "" to the backend
  // while its MultiSelect sibling shipped [].
  it('castValue coerces "" to [] for both array controls', () => {
    expect(castValue('', 'MultiSelect')).toEqual([]);
    expect(castValue('', 'CheckboxGroup')).toEqual([]);
  });

  it('castValue splits comma-separated strings for both', () => {
    expect(castValue('a,b', 'MultiSelect')).toEqual(['a', 'b']);
    expect(castValue('a, b', 'CheckboxGroup')).toEqual(['a', 'b']);
  });

  it('castValue passes arrays through untouched for both', () => {
    expect(castValue(['a'], 'MultiSelect')).toEqual(['a']);
    expect(castValue(['a'], 'CheckboxGroup')).toEqual(['a']);
  });

  it('castValue keeps null as null for both', () => {
    expect(castValue(null, 'MultiSelect')).toBeNull();
    expect(castValue(null, 'CheckboxGroup')).toBeNull();
  });

  it('getPayload emits the same shape for both', () => {
    const fields = {ms: {as: 'MultiSelect'}, cg: {as: 'CheckboxGroup'}} as any;
    expect(getPayload({ms: {value: ''}, cg: {value: ''}} as any, fields)).toEqual({ms: [], cg: []});
    expect(getPayload({ms: {value: ['a']}, cg: {value: ['a']}} as any, fields)).toEqual({ms: ['a'], cg: ['a']});
  });

  it('non-array controls are unchanged by the cast', () => {
    expect(castValue('', 'InputText')).toBe('');
    expect(castValue('', 'Select')).toBe('');
    expect(castValue('a,b', 'InputText')).toBe('a,b');
  });
});

describe('hidden array fields skip validation entirely', () => {
  const fields = {
    toggle: {label: 'Toggle', as: 'Checkbox', defaultValue: false},
    tags: {
      label: 'Tags', as: 'MultiSelect', schema: 'required|min:2',
      options: [{label: 'A', value: 'a'}],
      showWhen: {field: 'toggle', equals: true},
    },
  } as any;

  it('a hidden required MultiSelect does not block submission', async () => {
    expect(await errorsFor(fields, {toggle: false, tags: ''})).toEqual({});
  });

  it('the same field validates once visible', async () => {
    const errs = await errorsFor(fields, {toggle: true, tags: ''});
    expect(errs.tags).toBeDefined();
  });
});
