/** @type {import('tailwindcss').Config} */
const hongyishiPreset = require('@hongyishi/config/tailwind');

module.exports = {
  presets: [hongyishiPreset],
  content: ['./index.html', './pages/**/*.html', './assets/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        'brand-orange': '#FF6B00',
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
