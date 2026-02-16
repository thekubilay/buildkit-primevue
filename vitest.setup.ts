import { config } from '@vue/test-utils';

// Silence Vue warnings in tests unless needed
config.global.config = config.global.config || {} as any;

// Provide minimal stubs for PrimeVue components used by FormKit to avoid heavy rendering
config.global.stubs = {
  ...(config.global.stubs || {}),
};

// Module-level mocks to ensure correct replacement regardless of component names
import { vi } from 'vitest';

// Stub directly-imported PrimeVue components that require the $primevue plugin context
const stubComponent = (name: string) => ({
  default: { name, template: `<input :name="name" />`, props: ['name', 'modelValue', 'size', 'id', 'inputId', 'class'] }
});

vi.mock('primevue/inputtext', () => stubComponent('InputText'));
vi.mock('primevue/iconfield', () => ({ default: { name: 'IconField', template: '<div><slot/></div>' } }));
vi.mock('primevue/inputicon', () => ({ default: { name: 'InputIcon', template: '<span/>' } }));
vi.mock('primevue/editor', () => ({ default: { name: 'Editor', template: '<div/>' } }));

// Mock the barrel import used by FormKitControl for dynamic component resolution
const simpleStub = (name: string) => ({ name, template: `<input :name="name" />`, props: ['name', 'modelValue', 'size', 'id', 'inputId', 'class', 'value'] });
vi.mock('primevue', () => ({
  InputText: simpleStub('InputText'),
  Checkbox: simpleStub('Checkbox'),
  RadioButton: simpleStub('RadioButton'),
  Select: simpleStub('Select'),
  MultiSelect: simpleStub('MultiSelect'),
  DatePicker: simpleStub('DatePicker'),
  InputNumber: simpleStub('InputNumber'),
  Textarea: simpleStub('Textarea'),
  ToggleSwitch: simpleStub('ToggleSwitch'),
}));

vi.mock('@primevue/forms/form', () => ({
  default: {
    name: 'Form',
    template: '<form @submit.prevent="onSubmit"><slot :states="states" :getFieldState="getFieldState"></slot><slot name="footer"></slot></form>',
    props: ['initialValues','resolver'],
    data() {
      // Build states as { fieldName: { value: ... } } to match the real PrimeVue Form API
      const wrapped: Record<string, any> = {};
      Object.entries(this.initialValues || {}).forEach(([k, v]: [string, any]) => {
        wrapped[k] = { value: v };
      });
      return { states: wrapped };
    },
    methods: {
      getFieldState(name: string) { return (this as any).states[name] || { value: undefined } },
      onSubmit() { (this as any).$emit('submit', { states: (this as any).states, valid: true }) }
    }
  }
}));

vi.mock('@primevue/forms/formfield', () => ({
  default: {
    name: 'FormField',
    template: '<div><slot :error="null"/></div>',
    props: ['name']
  }
}));
