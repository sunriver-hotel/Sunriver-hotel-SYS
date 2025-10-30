/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sunriver-yellow': '#e6c872',
        'sunriver-yellow-light': '#f3e6c0',
      },
    },
  },
  plugins: [],
}
