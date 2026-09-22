/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a192f',
          800: '#0f2942',
          700: '#1b3a5c',
          600: '#234873',
          100: '#eef3f8',
          50: '#f6f9fc',
        },
        rail: {
          orange: '#f97316',
          red: '#e11d48',
          gold: '#eab308',
          green: '#16a34a',
        }
      }
    },
  },
  plugins: [],
}
