import {createApp} from 'vue'
import './styles.css'
import App from './App.vue'

import {BuildKitPrimeVue} from './index.ts'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura';

createApp(App)
  .use(PrimeVue, {
    ripple: true,
    theme: {
      preset: Aura,
    },
  })
  .use(BuildKitPrimeVue)
  .mount('#app')