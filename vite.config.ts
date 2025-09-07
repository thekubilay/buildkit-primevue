import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  optimizeDeps: {
    include: [
      'primevue',
      'primevue/message',
      'primevue/iconfield',
      'primevue/inputicon',
      'primevue/inputtext',
      'primevue/editor',
      'primevue/checkbox',
      'primevue/checkboxgroup',
      'primevue/radiobutton',
      'primevue/radiobuttongroup',
      'primevue/button',
      '@primevue/forms',
      '@primevue/forms/form',
      '@primevue/forms/formfield',
      '@primevue/forms/resolvers/zod',
      '@primeuix/utils',
      'axios',
      'zod'
    ]
  },
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
    }
  }
})
