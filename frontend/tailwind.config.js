/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdeed6',
          200: '#fbd8a9',
          300: '#f8bc72',
          400: '#f5963b',
          500: '#f27d25',
          600: '#e8601a',
          700: '#c44814',
          800: '#9f3a16',
          900: '#7e3117',
        },
      },
    },
  },
  plugins: [],
}
