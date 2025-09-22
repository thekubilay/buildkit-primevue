// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
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
        }
      }
    },
    // Include CSS in build
    cssCodeSplit: false
  }
})