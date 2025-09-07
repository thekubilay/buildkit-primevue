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

function findFieldWrappers(wrapper: any) {
  // FormKitField renders a FormField div; our stub simply renders a div with slot
  // We'll query by label text presence in DOM of FormKitField wrapper using v-show effect on root
  return wrapper.findAllComponents({name: 'FormField'});
}

describe('FormKit visibility', () => {
  it('hides field when hideWhen condition matches and shows when not', async () => {
    const fields = makeFields();
    const {wrapper, model} = mountForm(fields);

    await nextTick();

    const fieldsEls = findFieldWrappers(wrapper);

    const isVisible = (label: string) => {
      const el = fieldsEls.find(w => w.text().includes(label))!;
      const style = (el.element as HTMLElement).getAttribute('style') || '';
      return !/display:\s*none/.test(style);
    };

    // name default is 'article' so email must be hidden, phone shown
    expect(isVisible('Phone')).toBe(true);
    expect(isVisible('Email')).toBe(false);

    // Change model state to trigger watchers
    model.value.states.name = 'john';
    await nextTick();

    expect(isVisible('Email')).toBe(true);
    expect(isVisible('Phone')).toBe(false);
  });

  it('filters submitted states by visibility', async () => {
    const fields = makeFields();
    const {wrapper} = mountForm(fields);
    await nextTick();

    // Trigger submit on Form stub
    const form = wrapper.find('form');
    await form.trigger('submit');

    const emitted = (wrapper.vm as any).$emit ? (wrapper.emitted && wrapper.emitted()) : wrapper.emitted();
    const submitEvents = emitted['submit'];
    expect(submitEvents).toBeTruthy();
    const payload = submitEvents[0][0];
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

    const fieldsEls = findFieldWrappers(wrapper);
    const isVisible = (label: string) => {
      const el = fieldsEls.find(w => w.text().includes(label))!;
      const style = (el.element as HTMLElement).getAttribute('style') || '';
      return !/display:\s*none/.test(style);
    };

    expect(isVisible('Result')).toBe(true);
    expect(isVisible('Blocked')).toBe(false);

    model.value.states.keyword = 'foo bar';
    await nextTick();

    expect(isVisible('Result')).toBe(false);
    expect(isVisible('Blocked')).toBe(true);
  });
});
