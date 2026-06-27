const forms = require('@tailwindcss/forms');
const hongyishiPreset = require('@hongyishi/config/tailwind');
const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [hongyishiPreset],
  content: ['./index.html', './offline.html', './pages/**/*.{html,js}', './pwa-register.js'],
  theme: {
    extend: {},
  },
  plugins: [forms, typography],
};
