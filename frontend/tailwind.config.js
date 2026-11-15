/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
    "../products/*/web/**/*.{js,jsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

