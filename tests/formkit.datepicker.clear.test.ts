import {describe, expect, it, vi} from 'vitest';
import {mount} from '@vue/test-utils';
import {nextTick} from 'vue';

// This suite must run against the REAL PrimeVue components: the bug lives in
// BaseEditableHolder's $formDefaultValue fallback inside DatePicker's inner InputText,
// which the global stubs in vitest.setup.ts would hide entirely.
// jsdom has no matchMedia; DatePicker's responsive/touch-UI hook needs it on mount.
// Deliberately no teardown — Vitest isolates module + global state per test file.
window.matchMedia = window.matchMedia || ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as any;

vi.unmock('primevue');
vi.unmock('primevue/inputtext');
vi.unmock('@primevue/forms/form');
vi.unmock('@primevue/forms/formfield');

const mountFields = async (fields: Record<string, any>) => {
  const PrimeVue = (await import('primevue/config')).default;
  const FormKit = (await import('../src/components/formkit/FormKit.vue')).default;

  const wrapper = mount(FormKit, {
    props: {fields},
    global: {plugins: [PrimeVue]},
    attachTo: document.body,
  });

  await nextTick();
  await nextTick();
  return wrapper;
};

const mountForm = (defaultValue: any) =>
  mountFields({d: {as: 'DatePicker', label: 'date', dateFormat: 'yy年mm月dd日', defaultValue}});

// The visible DatePicker input is a real InputText; grab it and clear it the way a user does.
const clearInput = async (wrapper: any) => {
  const input = wrapper.find('input.p-datepicker-input');
  expect(input.exists()).toBe(true);
  (input.element as HTMLInputElement).value = '';
  await input.trigger('input');
  await input.trigger('blur');
  await nextTick();
  await nextTick();
  return input;
};

const fieldValue = (wrapper: any) => wrapper.vm.$refs?.formRef?.getFieldState?.('d')?.value;

describe('DatePicker clearing in edit mode', () => {
  it('keeps the input empty after clearing a pre-filled date', async () => {
    const wrapper = await mountForm(new Date(2026, 6, 1));

    const input = await clearInput(wrapper);

    // Before the fix the stale Date snapped back in as its raw toString().
    expect((input.element as HTMLInputElement).value).toBe('');
  });

  it('writes null — not "" or a raw string — into form state after clearing', async () => {
    const wrapper = await mountForm(new Date(2026, 6, 1));

    await clearInput(wrapper);

    const value = fieldValue(wrapper);
    expect(value === null || value === undefined).toBe(true);
    expect(typeof value).not.toBe('string');
  });

  it('renders the existing date formatted on first render', async () => {
    const wrapper = await mountForm(new Date(2026, 6, 1));

    const input = wrapper.find('input.p-datepicker-input');
    expect((input.element as HTMLInputElement).value).toBe('2026年07月01日');
  });

  it('does not register the inner InputText on the form (no name attribute)', async () => {
    const wrapper = await mountForm(new Date(2026, 6, 1));

    const input = wrapper.find('input.p-datepicker-input');
    expect(input.attributes('name')).toBeUndefined();
  });

  it('still clears in create mode (no regression)', async () => {
    const wrapper = await mountForm(null);

    const input = await clearInput(wrapper);

    expect((input.element as HTMLInputElement).value).toBe('');
    const value = fieldValue(wrapper);
    expect(value === null || value === undefined).toBe(true);
  });

  it('writes a Date — not the raw string — when the date is typed by hand', async () => {
    const wrapper = await mountForm(new Date(2026, 6, 1));

    const input = wrapper.find('input.p-datepicker-input');
    (input.element as HTMLInputElement).value = '2026年08月05日';
    await input.trigger('input');
    await input.trigger('blur');
    await nextTick();
    await nextTick();

    const value = fieldValue(wrapper);
    expect(value).toBeInstanceOf(Date);
    expect((value as Date).getFullYear()).toBe(2026);
    expect((value as Date).getMonth()).toBe(7);
    expect((value as Date).getDate()).toBe(5);
  });

  it('still validates a required date field on submit', async () => {
    const wrapper = await mountFields({
      d: {as: 'DatePicker', label: 'date', dateFormat: 'yy年mm月dd日', defaultValue: new Date(2026, 6, 1), schema: 'required'},
    });

    await clearInput(wrapper);
    await wrapper.find('form').trigger('submit');
    await nextTick();
    await nextTick();

    // Cleared + required => submit must not be emitted as a valid submission.
    const submits = wrapper.emitted('submit') as any[] | undefined;
    expect(submits?.some((e) => e?.[0]?.valid === true) ?? false).toBe(false);
    expect(wrapper.vm.$refs?.formRef?.getFieldState?.('d')?.invalid).toBe(true);
  });

  // NOTE: this only asserts that a hidden date field unmounts cleanly. It deliberately does
  // NOT assert that form state is reset to null: FormKit.vue's `v-if="fieldVisibility[...]"`
  // unmounts the wrapper before FormKitField's own watch(isVisible) can call clearFieldValue,
  // so hidden fields keep their value. That gap is pre-existing, affects every field type
  // (plain InputText included), and is out of scope for the DatePicker clearing fix.
  it('unmounts a date field that becomes hidden via hideWhen', async () => {
    const wrapper = await mountFields({
      toggle: {as: 'InputText', label: 'toggle', defaultValue: ''},
      d: {
        as: 'DatePicker',
        label: 'date',
        dateFormat: 'yy年mm月dd日',
        defaultValue: new Date(2026, 6, 1),
        hideWhen: {field: 'toggle', equals: 'hide'},
      },
    });

    expect(wrapper.find('input.p-datepicker-input').exists()).toBe(true);

    wrapper.vm.$refs?.formRef?.setFieldValue?.('toggle', 'hide');
    await nextTick();
    await nextTick();

    expect(wrapper.find('input.p-datepicker-input').exists()).toBe(false);
  });
});
