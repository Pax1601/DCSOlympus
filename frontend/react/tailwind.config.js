/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: {
          darker: "#202831",
          dark: "#2D3742",
          neutral: "#394552"
        },
        interaction: {
          blue: "#5CA7FF"
        },
        olympus:{
          50: "#516176",
          100: "#4A5A6F",
          200: "#435367",
          300: "#38475A",
          400: "#303F51",
          500: "#2A3949",
          600: "#243141",
          700: "#1C2836",
          800: "#17212D",
          900: "#171C26"
        }
      }
    },
  },
  plugins: [
  ],
  darkMode: 'class'
}


