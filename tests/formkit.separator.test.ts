import {mount} from '@vue/test-utils';
import {nextTick, ref} from 'vue';
import FormKit from '../src/components/formkit/FormKit.vue';
import FormKitSeparator from '../src/components/formkit/FormKitSeparator.vue';
import {isSeparatorField} from '../src/components/formkit/utils/isSeparator';
import {getPayload} from '../src/components/formkit/utils/getPayload';
import {setFields} from '../src/components/formkit/utils/setFields';
import {clear} from '../src/components/formkit/utils/clear';
import useFormKitValidations from '../src/components/formkit/useFormKitValidations';

function mountForm(fields: any) {
  const model = ref<any>({states: {}, getFieldState: () => ({value: undefined})});
  return mount(FormKit as any, {props: {modelValue: model, fields}});
}

describe('isSeparatorField', () => {
  it('matches only Separator, leaving the pre-existing Divider passthrough alone', () => {
    expect(isSeparatorField({as: 'Separator'})).toBe(true);
    expect(isSeparatorField({as: 'Divider'})).toBe(false);
    expect(isSeparatorField({as: 'InputText'})).toBe(false);
    expect(isSeparatorField({})).toBe(false);
    expect(isSeparatorField(undefined)).toBe(false);
  });
});

describe('FormKitSeparator rendering', () => {
  it('renders a bare rule with no content wrapper when there is no label', () => {
    const w = mount(FormKitSeparator as any, {props: {rest: {as: 'Separator'}}});
    expect(w.find('[role="separator"]').exists()).toBe(true);
    expect(w.find('.bk-separator-label').exists()).toBe(false);
    expect(w.find('.p-divider-content').exists()).toBe(false);
  });

  it('renders the label when one is provided', () => {
    const w = mount(FormKitSeparator as any, {props: {label: 'Personal Info', rest: {as: 'Separator'}}});
    expect(w.find('.bk-separator-label').text()).toBe('Personal Info');
  });

  it('treats a whitespace-only label as no label', () => {
    const w = mount(FormKitSeparator as any, {props: {label: '   ', rest: {as: 'Separator'}}});
    expect(w.find('.bk-separator-label').exists()).toBe(false);
  });

  it('defaults to a centered horizontal solid rule', () => {
    const w = mount(FormKitSeparator as any, {props: {label: 'X', rest: {as: 'Separator'}}});
    const root = w.find('[role="separator"]');
    expect(root.attributes('data-align')).toBe('center');
    expect(root.attributes('data-type')).toBe('solid');
    expect(root.attributes('data-layout')).toBe('horizontal');
  });

  it('forwards align, type and layout to the Divider', () => {
    const w = mount(FormKitSeparator as any, {
      props: {label: 'X', rest: {as: 'Separator', align: 'left', type: 'dashed', layout: 'vertical'}},
    });
    const root = w.find('[role="separator"]');
    expect(root.attributes('data-align')).toBe('left');
    expect(root.attributes('data-type')).toBe('dashed');
    expect(root.attributes('data-layout')).toBe('vertical');
  });

  it('applies a custom class alongside bk-separator', () => {
    const w = mount(FormKitSeparator as any, {props: {rest: {as: 'Separator', class: 'my-sep'}}});
    const classes = w.find('[role="separator"]').classes();
    expect(classes).toContain('bk-separator');
    expect(classes).toContain('my-sep');
  });

  it('does not leak library-only keys onto the Divider as attributes', () => {
    const w = mount(FormKitSeparator as any, {
      props: {rest: {as: 'Separator', schema: 'required', defaultValue: 'x', showWhen: {field: 'a', equals: 1}}},
    });
    const attrs = w.find('[role="separator"]').attributes();
    expect(attrs).not.toHaveProperty('as');
    expect(attrs).not.toHaveProperty('schema');
    expect(attrs).not.toHaveProperty('defaultvalue');
  });
});

describe('FormKit separator integration', () => {
  const fields = () => ({
    name: {inputId: 'name_id', label: 'Name', defaultValue: 'a'},
    sep: {as: 'Separator', label: 'Section', align: 'center', type: 'dashed'},
    email: {inputId: 'email_id', label: 'Email', defaultValue: ''},
  } as any);

  it('renders the separator without a FormField wrapper', () => {
    const w = mountForm(fields());
    expect(w.findComponent(FormKitSeparator).exists()).toBe(true);
    expect(w.find('.bk-separator-label').text()).toBe('Section');
  });

  it('keeps the separator out of the Form initial values', () => {
    const w = mountForm(fields());
    const form = w.findComponent({name: 'Form'});
    const initial = form.props('initialValues') as Record<string, any>;
    expect(Object.keys(initial).sort()).toEqual(['email', 'name']);
    expect(initial).not.toHaveProperty('sep');
  });

  it('honours showWhen/hideWhen on a separator', async () => {
    const w = mountForm({
      name: {label: 'Name', defaultValue: 'hidden'},
      sep: {as: 'Separator', label: 'Section', hideWhen: {field: 'name', equals: 'hidden'}},
    } as any);
    await nextTick();
    expect(w.findComponent(FormKitSeparator).exists()).toBe(false);
  });

  it('keeps the separator out of the submit payload', async () => {
    const w = mountForm(fields());
    await w.find('form').trigger('submit');
    const states = (w.emitted('submit') as any)[0][0].states;
    expect(Object.keys(states).sort()).toEqual(['email', 'name']);
  });
});

describe('separator-aware utils', () => {
  const fields = () => ({
    name: {label: 'Name', defaultValue: 'a'},
    sep: {as: 'Separator', label: 'Section'},
  } as any);

  it('getPayload skips separator entries even if a state exists', () => {
    const payload = getPayload({name: {value: 'a'}, sep: {value: 'junk'}} as any, fields());
    expect(payload).toEqual({name: 'a'});
  });

  it('setFields does not assign a defaultValue to a separator', () => {
    const f = fields();
    setFields({name: 'b', sep: 'junk'}, f);
    expect(f.name.defaultValue).toBe('b');
    expect(f.sep).not.toHaveProperty('defaultValue');
  });

  it('clear does not reset a separator', () => {
    const f = fields();
    clear({name: 'b', sep: 'junk'}, f);
    expect(f.name.defaultValue).toBe('');
    expect(f.sep).not.toHaveProperty('defaultValue');
  });

  it('builds no schema entry for a separator', () => {
    const {createDynamicSchema} = useFormKitValidations();
    const schema = createDynamicSchema(fields());
    expect(Object.keys(schema.shape).sort()).toEqual(['name']);
  });

  it('a required-looking separator never blocks validation', async () => {
    const {resolver} = useFormKitValidations({
      name: {label: 'Name', schema: 'required', required: true},
      sep: {as: 'Separator', label: 'Section', schema: 'required', required: true},
    } as any);
    const result: any = await resolver({values: {name: 'ok'}, name: undefined});
    expect(result.errors?.sep).toBeUndefined();
    expect(result.errors?.name).toBeUndefined();
  });
});
