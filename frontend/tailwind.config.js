/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          cyan: '#00f0ff',
          pink: '#ff007f',
          yellow: '#ffe600',
          green: '#39ff14',
          purple: '#b026ff',
          dark: '#07090e',
          panel: '#0c101a'
        }
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        sans: ['Rajdhani', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace']
      }
    },
  },
  plugins: [],
}
