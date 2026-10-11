/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: { 950: '#07080d', 900: '#0b0d14', 800: '#11141e', 700: '#181c29', 600: '#232838', 500: '#343a50' },
        lime: { 400: '#c6f432', 500: '#b0e01a' },
        violet: { 400: '#a78bfa', 500: '#8b5cf6' },
      },
      boxShadow: { glow: '0 0 40px -10px rgba(198,244,50,.35)' },
    },
  },
  plugins: [],
}
