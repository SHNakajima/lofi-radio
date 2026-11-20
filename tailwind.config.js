/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Noto Sans JP"', 'sans-serif'],
        display: ['Antonio', '"Noto Sans JP"', 'sans-serif'],
      }
    }
  },
  plugins: []
};
