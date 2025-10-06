import PrimeUI from 'tailwindcss-primeui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx,html}",
    "./src/**/**/*.{vue,js,ts,jsx,tsx,html}", // Include nested directories
    // Include PrimeVue components that your library might use
    "./node_modules/buildkit-primevue/src/components/**/*.vue"
  ],
  theme: {
    extend: {},
  },
  plugins: [PrimeUI],
  corePlugins: {preflight: true},
}