/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        drive: {
          blue: '#1a73e8',
          'blue-hover': '#1557b0',
          'blue-light': '#e8f0fe',
          surface: '#ffffff',
          bg: '#f8fafd',
          border: '#e0e2e5',
          text: '#1f1f1f',
          subtext: '#444746',
          hover: '#f0f4f9',
          selected: '#c2e7ff'
        }
      },
      fontFamily: {
        sans: ['"Google Sans"', 'Roboto', 'Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
