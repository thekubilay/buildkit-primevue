// Public entry for the library
import type {App} from 'vue';

// Components
import FormKit from './components/formkit/FormKit.vue';
import FormKitControl from './components/formkit/FormKitControl.vue';
import FormKitField from './components/formkit/FormKitField.vue';
import FormKitLabel from './components/formkit/FormKitLabel.vue';

// Types
export * from './components/formkit/types/FormKitProps';
// Utils
export * from './components/formkit/utils/visibility';

// Named exports for components
export {
  FormKit,
  FormKitControl,
  FormKitField,
  FormKitLabel,
};

// Plugin installs to register all components globally (optional for consumers)
export const BuildKitPrimeVue = {
  install(app: App) {
    app.component('FormKit', FormKit);
    app.component('FormKitControl', FormKitControl);
    app.component('FormKitField', FormKitField);
    app.component('FormKitLabel', FormKitLabel);
  },
};

