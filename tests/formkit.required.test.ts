import {mount} from '@vue/test-utils';
import {nextTick, reactive, ref} from 'vue';
import FormKit from '../src/components/formkit/FormKit.vue';
import useFormKitValidations from '../src/components/formkit/useFormKitValidations';

/**
 * `required` and `schema: "required"` are two independent knobs:
 *
 *   required: true      → renders the red `*` on the label. Nothing else.
 *   schema: "required"  → actually enforces the value.
 *
 * `field.required` used to also feed the resolver's `isRequired`, which silently enforced
 * on 7 of 10 component types (InputText, Textarea, the bare default, InputNumber,
 * DatePicker, Select, RadioButton) while doing nothing for Checkbox, MultiSelect and
 * CheckboxGroup — the same config behaved differently depending on `as`.
 */

async function errorFor(field: any, value: any) {
  const {resolver} = useFormKitValidations({f: field} as any, 'ja');
  const result: any = await resolver({values: {f: value}, name: undefined});
  const v: any = result.errors?.f;
  return (Array.isArray(v) ? v[0]?.message : v?.message) ?? undefined;
}

// Every component type, paired with the value that represents "empty" for it.
const componentCases: Array<[string, any, any]> = [
  ['InputText', {as: 'InputText'}, ''],
  ['Textarea', {as: 'Textarea'}, ''],
  ['no `as` (defaults to InputText)', {}, ''],
  ['InputNumber', {as: 'InputNumber'}, null],
  ['DatePicker', {as: 'DatePicker'}, null],
  ['Select', {as: 'Select', options: [{label: 'A', value: 'a'}]}, null],
  ['RadioButton', {as: 'RadioButton', options: [{label: 'A', value: 'a'}]}, null],
  ['Checkbox', {as: 'Checkbox'}, false],
  ['MultiSelect', {as: 'MultiSelect', options: []}, []],
  ['CheckboxGroup', {as: 'CheckboxGroup', options: []}, []],
];

describe('`required: true` never blocks validation, for any component type', () => {
  for (const [name, base, empty] of componentCases) {
    it(`${name} passes when empty`, async () => {
      expect(await errorFor({...base, label: name, required: true}, empty)).toBeUndefined();
    });
  }

  it('a valid value obviously still passes', async () => {
    expect(await errorFor({as: 'InputText', required: true}, 'hello')).toBeUndefined();
  });
});

describe('`schema: "required"` does block validation', () => {
  // Checkbox is the documented exception: an unchecked box is a legitimate `false`, and
  // the boolean branch only enforces `=== true` through the schema-string rule.
  for (const [name, base, empty] of componentCases) {
    it(`${name} blocks when empty`, async () => {
      const err = await errorFor({...base, label: name, schema: 'required'}, empty);
      if (name === 'Checkbox') expect(err).toBeUndefined();
      else expect(err).toBeDefined();
    });
  }
});

describe('the two knobs combine without interfering', () => {
  it('both set: still enforced', async () => {
    expect(await errorFor({as: 'InputText', required: true, schema: 'required'}, '')).toBeDefined();
  });

  it('required: true does not activate the OTHER schema rules', async () => {
    // Rules are gated behind the schema containing `required`; the flag must not stand in.
    expect(await errorFor({as: 'InputText', required: true, schema: 'email'}, 'not-an-email')).toBeUndefined();
    expect(await errorFor({as: 'InputText', schema: 'required|email'}, 'not-an-email')).toBeDefined();
  });

  it('required: true does not change a valid optional value', async () => {
    expect(await errorFor({as: 'MultiSelect', options: [], required: true}, ['a'])).toBeUndefined();
  });

  // Consequence worth pinning: an optional Select resolves to z.any().optional(), so it no
  // longer whitelists against `options`. `required: true` used to buy that check for free.
  it('an optional Select accepts a value outside its options', async () => {
    const opts = [{label: 'A', value: 'a'}, {label: 'B', value: 'b'}];
    expect(await errorFor({as: 'Select', options: opts, required: true}, 'not-an-option')).toBeUndefined();
    expect(await errorFor({as: 'Select', options: opts, schema: 'required'}, 'not-an-option')).toBeDefined();
  });
});

describe('inputId reaches the control regardless of `as`', () => {
  // The id used to be assigned only inside the `k === "as"` branch of FormKitControl's
  // bindings loop, so a field relying on the default InputText never got one and the
  // <label for> FormKitLabel emits pointed at nothing.
  function mountFields(fields: any) {
    const model = ref<any>({states: {}, getFieldState: () => ({value: undefined})});
    return mount(FormKit as any, {props: {modelValue: model, fields}});
  }

  it('a field with no `as` still gets the id', () => {
    const w = mountFields({no_as: {label: 'No as', inputId: 'id_no_as', defaultValue: ''}} as any);
    expect(w.find('#id_no_as').exists()).toBe(true);
  });

  it('an explicit `as` still gets the id', () => {
    const w = mountFields({
      text: {label: 'Text', as: 'InputText', inputId: 'id_text', defaultValue: ''},
      area: {label: 'Area', as: 'Textarea', inputId: 'id_area', defaultValue: ''},
    } as any);
    expect(w.find('#id_text').exists()).toBe(true);
    expect(w.find('#id_area').exists()).toBe(true);
  });

  it('every label points at a control that exists', () => {
    const w = mountFields({
      no_as: {label: 'No as', inputId: 'lbl_no_as', defaultValue: ''},
      with_as: {label: 'With as', as: 'InputText', inputId: 'lbl_with_as', defaultValue: ''},
    } as any);
    const fors = w.findAll('label.bk-label')
      .map(l => l.attributes('for'))
      .filter((f): f is string => !!f);
    expect(fors.length).toBe(2);
    for (const target of fors) {
      expect(w.find(`#${target}`).exists()).toBe(true);
    }
  });

  it('`as` itself is never forwarded to the control as an attribute', () => {
    const w = mountFields({text: {label: 'Text', as: 'InputText', inputId: 'id_as_attr', defaultValue: ''}} as any);
    expect(w.find('#id_as_attr').attributes('as')).toBeUndefined();
  });

  it('a field without inputId renders no id rather than an empty one', () => {
    const w = mountFields({plain: {label: 'Plain', as: 'InputText', defaultValue: ''}} as any);
    const input = w.find('input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('id')).toBeUndefined();
  });

  // The stubs mirror the real split: wrapper components declare `inputId` and put it on
  // the inner element, plain ones take `id`. FormKitControl decides by inspecting the
  // component's declared props, so the id must land on the actual <input> either way —
  // never on the wrapper, where a <label for> could not focus it.
  const byComponent: Array<[string, any]> = [
    ['InputText', {as: 'InputText'}],
    ['Textarea', {as: 'Textarea'}],
    ['default (no as)', {}],
    ['Select', {as: 'Select'}],
    ['MultiSelect', {as: 'MultiSelect'}],
    ['DatePicker', {as: 'DatePicker'}],
    ['InputNumber', {as: 'InputNumber'}],
    ['Checkbox', {as: 'Checkbox'}],
    ['ToggleSwitch', {as: 'ToggleSwitch'}],
  ];

  for (const [name, base] of byComponent) {
    it(`${name}: the id lands on the <input>, not a wrapper`, () => {
      const w = mountFields({f: {...base, label: name, inputId: 'the_id', defaultValue: null}} as any);
      const target = w.find('#the_id');
      expect(target.exists()).toBe(true);
      expect(target.element.tagName).toBe('INPUT');
    });
  }

  // Where the id cannot reach a focusable control, the label must carry no `for` rather
  // than one that dangles or points at a wrapper div.
  const noForCases: Array<[string, any]> = [
    ['CheckboxGroup with options', {as: 'CheckboxGroup', options: [{label: 'A', value: 'a'}]}],
    ['RadioButton with options', {as: 'RadioButton', options: [{label: 'A', value: 'a'}]}],
    ['Slider', {as: 'Slider'}],
    ['Editor', {as: 'Editor'}],
  ];

  for (const [name, base] of noForCases) {
    it(`${name}: the field label omits \`for\``, () => {
      const w = mountFields({f: {...base, label: name, inputId: 'unreachable', defaultValue: null}} as any);
      expect(w.find('label.bk-label').attributes('for')).toBeUndefined();
    });
  }

  it('a RadioButton WITHOUT options still gets a working `for`', () => {
    const w = mountFields({f: {as: 'RadioButton', label: 'Single', inputId: 'single_radio', defaultValue: null}} as any);
    expect(w.find('label.bk-label').attributes('for')).toBe('single_radio');
    expect(w.find('#single_radio').exists()).toBe(true);
  });

  it('the `for` follows a config that changes in place after mount', async () => {
    // FormKit keys each field block by `inputId ?? name`, so mutating `as`/`options` on a
    // live field does NOT remount FormKitField. A snapshotted `labelFor` would keep
    // pointing at an id the grouped rendering no longer emits.
    const fields = reactive({
      f: {as: 'RadioButton', label: 'Choice', inputId: 'live_id', defaultValue: null} as any,
    });
    const model = ref<any>({states: {}, getFieldState: () => ({value: undefined})});
    const w = mount(FormKit as any, {props: {modelValue: model, fields}});

    expect(w.find('label.bk-label').attributes('for')).toBe('live_id');
    expect(w.find('#live_id').exists()).toBe(true);

    fields.f.options = [{label: 'A', value: 'a'}, {label: 'B', value: 'b'}];
    await nextTick();

    expect(w.find('#live_id').exists()).toBe(false);
    expect(w.find('label.bk-label').attributes('for')).toBeUndefined();
  });

  it('grouped options keep their own per-option labels', () => {
    const w = mountFields({
      f: {
        as: 'CheckboxGroup', label: 'Group', inputId: 'grp', defaultValue: [],
        options: [{label: 'A', value: 'a'}, {label: 'B', value: 'b'}],
      },
    } as any);
    const optionFors = w.findAll('label.bk-group-label').map(l => l.attributes('for'));
    expect(optionFors.length).toBe(2);
    for (const target of optionFors) {
      expect(target).toBeTruthy();
      expect(w.find(`#${target}`).exists()).toBe(true);
    }
  });
});

describe('`required` never reaches the DOM as the native attribute', () => {
  it('no rendered input carries a `required` attribute', () => {
    const model = ref<any>({states: {}, getFieldState: () => ({value: undefined})});
    const wrapper = mount(FormKit as any, {
      props: {
        modelValue: model,
        fields: {
          text: {label: 'Text', inputId: 't', required: true, schema: 'required', defaultValue: ''},
          area: {label: 'Area', as: 'Textarea', inputId: 'a', required: true, defaultValue: ''},
        },
      },
    });
    const withAttr = wrapper.findAll('input, textarea').filter(el => el.attributes('required') !== undefined);
    expect(withAttr.length).toBe(0);
  });
});

describe('the asterisk comes from `required`, never from the schema', () => {
  // Maps labels to field names positionally, which only holds while every field is
  // visible and none is a separator — a hidden field renders no label (FormKitField's
  // v-if) and would shift the whole mapping. The length guard makes that fail loudly
  // instead of silently mis-attributing an asterisk to the wrong field.
  function asterisks(fields: any) {
    const model = ref<any>({states: {}, getFieldState: () => ({value: undefined})});
    const wrapper = mount(FormKit as any, {props: {modelValue: model, fields}});
    const names = Object.keys(fields);
    const labels = wrapper.findAll('label.bk-label');
    expect(labels.length).toBe(names.length);
    const out: Record<string, boolean> = {};
    labels.forEach((label, i) => {
      out[names[i]] = label.text().includes('*');
    });
    return out;
  }

  it('only fields with `required: true` render one', () => {
    expect(asterisks({
      marker_only: {label: 'required: true', required: true},
      schema_only: {label: 'schema required', schema: 'required'},
      both: {label: 'both', required: true, schema: 'required'},
      neither: {label: 'neither'},
    } as any)).toEqual({
      marker_only: true,
      schema_only: false,
      both: true,
      neither: false,
    });
  });
});
