import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'BuildkitPrimeVue',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.mjs' : 'index.cjs'
    },
    rollupOptions: {
      external: [
        'vue',
        'primevue',
        '@primevue/forms',
        '@primevue/forms/form',
        '@primevue/forms/formfield',
        'zod',
        'axios',
        '@primeuix/utils',
        '@vueuse/core'
      ],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'styles.css') {
            return 'styles.css';
          }
          return assetInfo.name || '';
        }
      }
    }
  }
})