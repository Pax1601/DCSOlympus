/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "node_modules/flowbite-react/lib/esm/**/*.js",
    "node_modules/flowbite/**/*.js"
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
    require("flowbite/plugin"),
  ],
  darkMode: 'class'
}


