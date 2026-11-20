/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mjs}",
    "./public/slides/*.html",
    "./public/scripts/*.js",
    "./scripts/templates/*.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Prompt", "sans-serif"],
      },
      colors: {
        arduino: {
          teal: "#00979D",
          dark: "#006468",
          light: "#E6F4F4",
          orange: "#E47128",
        },
      },
    },
  },
  plugins: [],
};
