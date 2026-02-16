import {mount} from '@vue/test-utils';
import {nextTick, ref} from 'vue';
import FormKit from '../src/components/formkit/FormKit.vue';

function makeFields() {
  return {
    name: {
      inputId: 'name_id',
      label: 'Name',
      defaultValue: 'article',
    },
    email: {
      inputId: 'email_id',
      label: 'Email',
      defaultValue: '',
      hideWhen: {field: 'name', equals: 'article'},
    },
    phone: {
      inputId: 'phone_id',
      label: 'Phone',
      defaultValue: '',
      showWhen: {field: 'name', equals: 'article'},
    },
  } as any;
}

function mountForm(fields: any) {
  const initialValues: Record<string, any> = Object.fromEntries(Object.entries(fields).map(([k, v]: any) => [k, v.defaultValue]));
  const model = ref<any>({
    states: {...initialValues},
    getFieldState(name: string) {
      return {value: (this as any).states[name]}
    },
  });
  const wrapper = mount(FormKit as any, {
    props: {
      modelValue: model,
      fields,
    },
  });
  return {wrapper, model};
}

describe('FormKit visibility', () => {
  it('hides field when hideWhen condition matches and shows when not', async () => {
    const fields = makeFields();
    const {wrapper, model} = mountForm(fields);

    await nextTick();

    // The component uses v-if, so hidden fields are removed from the DOM entirely.
    // Check that the wrapper div for each field exists or not.
    const hasField = (label: string) => wrapper.html().includes(label);

    // name default is 'article' so email must be hidden, phone shown
    expect(hasField('Phone')).toBe(true);
    expect(hasField('Email')).toBe(false);

    // Change the form state to trigger watchers.
    // Access the underlying Form mock component and update its reactive states.
    const formComponent = wrapper.findComponent({name: 'Form'});
    (formComponent.vm as any).states.name = { value: 'john' };
    await nextTick();
    await nextTick(); // extra tick for watcher propagation

    expect(hasField('Email')).toBe(true);
    expect(hasField('Phone')).toBe(false);
  });

  it('filters submitted states by visibility', async () => {
    const fields = makeFields();
    const {wrapper} = mountForm(fields);
    await nextTick();

    // Trigger submit on Form stub
    const form = wrapper.find('form');
    await form.trigger('submit');

    const emitted = wrapper.emitted();
    const submitEvents = emitted['submit'];
    expect(submitEvents).toBeTruthy();
    const payload = submitEvents![0][0] as any;
    const stateKeys = Object.keys(payload.states);
    expect(stateKeys).toContain('name');
    expect(stateKeys).toContain('phone');
    expect(stateKeys).not.toContain('email');
  });

  it('supports includes match for showWhen/hideWhen', async () => {
    const fields: any = {
      keyword: {label: 'Keyword', defaultValue: 'hello world'},
      result: {label: 'Result', defaultValue: '', showWhen: {field: 'keyword', includes: 'world'}},
      blocked: {label: 'Blocked', defaultValue: '', hideWhen: {field: 'keyword', includes: 'hello'}},
    };
    const {wrapper, model} = mountForm(fields);
    await nextTick();

    const hasField = (label: string) => wrapper.html().includes(label);

    expect(hasField('Result')).toBe(true);
    expect(hasField('Blocked')).toBe(false);

    const formComponent = wrapper.findComponent({name: 'Form'});
    (formComponent.vm as any).states.keyword = { value: 'foo bar' };
    await nextTick();
    await nextTick();

    expect(hasField('Result')).toBe(false);
    expect(hasField('Blocked')).toBe(true);
  });
});
