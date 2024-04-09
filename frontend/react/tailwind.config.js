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
        }
      }
    },
  },
  plugins: [
  ],
  darkMode: 'class'
}


