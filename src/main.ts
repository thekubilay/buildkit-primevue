import { createApp } from 'vue'
import './tailwind.css'
import App from './App.vue'

// Import individual components (better for tree-shaking)
import { BuildKitPrimeVue } from './index.ts'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura';

createApp(App)
  .use(PrimeVue, {
    ripple: true,
    theme: {
      preset: Aura,
      options: {
        prefix: 'p',
        darkModeSelector: 'system',
        cssLayer: false
      }
    },
  })
  .use(BuildKitPrimeVue)
  .mount('#app')