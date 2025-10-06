import PrimeUI from 'tailwindcss-primeui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx,html}",
    "./src/**/**/*.{vue,js,ts,jsx,tsx,html}", // Include nested directories
  ],
  theme: {
    extend: {},
  },
  plugins: [PrimeUI],
  corePlugins: {preflight: true},
}