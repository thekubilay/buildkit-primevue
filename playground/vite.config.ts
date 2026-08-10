import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {fileURLToPath} from 'node:url'

const resolveFromPlayground = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3100,
    // The library is linked via `file:..`, which lands outside this directory.
    fs: {allow: [resolveFromPlayground('.'), resolveFromPlayground('..')]},
  },
  resolve: {
    // `buildkit-primevue` is a symlink to the repo root, so its externalised
    // imports (vue, primevue, zod, ...) would otherwise resolve against the
    // ROOT node_modules and load a second copy of each singleton. Deduping
    // pins every one of them to the playground's own install — exactly what a
    // real consumer app ends up with.
    dedupe: [
      'vue',
      'primevue',
      '@primevue/forms',
      '@primeuix/themes',
      '@primeuix/utils',
      '@vueuse/core',
      'zod',
      'axios',
    ],
  },
  optimizeDeps: {
    // Force pre-bundling to follow the symlink instead of serving a cached copy
    // from a previous library build.
    exclude: ['buildkit-primevue'],
  },
})
