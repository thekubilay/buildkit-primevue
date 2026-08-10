import {createApp} from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

// Everything below comes from the INSTALLED package (node_modules/buildkit-primevue),
// resolved through the package.json "exports" map — never from ../src. If an export
// is missing or the build is stale, the playground fails to boot, which is the point.
import {BuildKitPrimeVue} from 'buildkit-primevue'
import 'buildkit-primevue/styles.css'

import './styles.css'
import App from './App.vue'

createApp(App)
  .use(PrimeVue, {ripple: true, theme: {preset: Aura}})
  .use(BuildKitPrimeVue)
  .mount('#app')
