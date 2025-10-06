// Public entry for the library
import type {App, Plugin} from 'vue';
import {version} from '../package.json';

// Styles (exported and bundled)
import './styles.css';

// Components
import FormKit from './components/formkit/FormKit.vue';
import FormKitControl from './components/formkit/FormKitControl.vue';
import FormKitField from './components/formkit/FormKitField.vue';
import FormKitLabel from './components/formkit/FormKitLabel.vue';

// Types
export * from './components/formkit/types/FormKitProps';
// Utils
export * from './components/formkit/utils/visibility';
export {setDynamicFields} from './components/formkit/utils/setDynamicFields';
export {getPayload} from './components/formkit/utils/getPayload';
export {setFields} from './components/formkit/utils/setFields';
export {clear} from './components/formkit/utils/clear';

// Named exports for components
export {
  FormKit,
  FormKitControl,
  FormKitField,
  FormKitLabel,
  version,
};

// Plugin for global registration
export const BuildKitPrimeVue = {
  install(app: App) {
    app.component('FormKit', FormKit);
    app.component('FormKitControl', FormKitControl);
    app.component('FormKitField', FormKitField);
    app.component('FormKitLabel', FormKitLabel);
  },
  version,
} as Plugin & { version: string };

// Default export is the main FormKit component for convenient import without {}
export default FormKit;