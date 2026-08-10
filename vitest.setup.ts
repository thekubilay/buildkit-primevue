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
// Real PrimeVue splits into two shapes, and FormKitControl picks `id` vs `inputId` by
// asking the component which props it declares. The stubs must mirror that or the tests
// would validate a choice the production components never make:
//
//   - plain controls (InputText, Textarea, Slider) take `id` straight on the element
//   - wrapper controls (Select, DatePicker, Checkbox, …) declare `inputId` and put it on
//     the focusable element inside their wrapper; a bare `id` would land on the wrapper
const INPUT_ID_COMPONENTS = new Set([
  'Checkbox', 'RadioButton', 'Select', 'MultiSelect', 'DatePicker', 'InputNumber', 'ToggleSwitch', 'Password',
]);

const baseProps = ['name', 'modelValue', 'size', 'class', 'value'];

const makeStub = (name: string) => INPUT_ID_COMPONENTS.has(name)
  ? {
      name,
      template: `<div class="p-wrapper"><input :name="name" :id="inputId" /></div>`,
      props: [...baseProps, 'inputId'],
    }
  : {
      name,
      template: `<input :name="name" :id="id" />`,
      props: [...baseProps, 'id'],
    };

const stubComponent = (name: string) => ({ default: makeStub(name) });

vi.mock('primevue/inputtext', () => stubComponent('InputText'));
vi.mock('primevue/iconfield', () => ({ default: { name: 'IconField', template: '<div><slot/></div>' } }));
vi.mock('primevue/inputicon', () => ({ default: { name: 'InputIcon', template: '<span/>' } }));
vi.mock('primevue/editor', () => ({ default: { name: 'Editor', template: '<div/>' } }));
vi.mock('primevue/divider', () => ({
  default: {
    name: 'Divider',
    template: '<div class="p-divider" role="separator" :data-align="align" :data-type="type" :data-layout="layout"><div v-if="$slots.default" class="p-divider-content"><slot/></div></div>',
    props: ['align', 'type', 'layout']
  }
}));

// Mock the barrel import used by FormKitControl for dynamic component resolution
const simpleStub = makeStub;
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
  Password: simpleStub('Password'),
  // Slider wraps its focusable handle, so the plain `id` lands on the outer element —
  // mirrored here because FormKitField relies on that to drop the label's `for`.
  Slider: { name: 'Slider', template: '<div class="p-slider" :id="id"><span role="slider" tabindex="0"/></div>', props: [...['name', 'modelValue', 'size', 'class', 'value'], 'id'] },
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
