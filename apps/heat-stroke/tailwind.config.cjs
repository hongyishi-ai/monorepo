/** @type {import('tailwindcss').Config} */
module.exports = {
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
