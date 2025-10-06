import PrimeUI from 'tailwindcss-primeui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx,html}",
    "./src/**/**/*.{vue,js,ts,jsx,tsx,html}", // Include nested directories
    // Include PrimeVue components that your library might use
    // "./node_modules/primevue/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/buildkit-primevue/**/*.{vue,js,mjs}" // Add this
  ],
  theme: {
    extend: {},
  },
  // Add a comprehensive safelist to ensure commonly used classes are included
  safelist: [
    // Flexbox classes
    'flex',
    'flex-col',
    'flex-row',
    'flex-wrap',
    'flex-nowrap',
    'items-center',
    'items-start',
    'items-end',
    'justify-center',
    'justify-start',
    'justify-end',
    'justify-between',
    'justify-around',
    // Spacing classes that might be commonly used
    {
      pattern: /^(p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr)-\d+$/,
    },
    // Width and height classes
    {
      pattern: /^(w|h)-\d+$/,
    },
    {
      pattern: /^(w|h)-(full|auto|screen)$/,
    },
    // Common display classes
    'block',
    'inline',
    'inline-block',
    'hidden',
    // Grid classes
    'grid',
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'gap-1',
    'gap-2',
    'gap-3',
    'gap-4',
  ],
  plugins: [PrimeUI],
  corePlugins: { preflight: true },
}