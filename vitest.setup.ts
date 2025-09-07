import { config } from '@vue/test-utils';

// Silence Vue warnings in tests unless needed
config.global.config = config.global.config || {} as any;

// Provide minimal stubs for PrimeVue components used by FormKit to avoid heavy rendering
config.global.stubs = {
  ...(config.global.stubs || {}),
};

// Module-level mocks to ensure correct replacement regardless of component names
import { vi } from 'vitest';

vi.mock('@primevue/forms/form', () => ({
  default: {
    name: 'Form',
    template: '<form @submit.prevent="$emit(\'submit\', { states: this.states, valid: true })"><slot :states="states" :getFieldState="getFieldState"></slot><slot name="footer"></slot></form>',
    props: ['initialValues','resolver'],
    data() { return { states: { ...(this.initialValues || {}) } } },
    methods: {
      getFieldState(name: string) { return { value: (this as any).states[name] } }
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
