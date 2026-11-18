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
  // Wrap hover: variants in @media (hover: hover) so they do not stick after a tap on touch screens
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
}

