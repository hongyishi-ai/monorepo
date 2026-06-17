const forms = require('@tailwindcss/forms');
const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './offline.html', './pages/**/*.{html,js}', './pwa-register.js'],
  theme: {
    extend: {},
  },
  plugins: [forms, typography],
};
