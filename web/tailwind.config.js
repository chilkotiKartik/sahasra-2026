/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: '475px',
      },
      colors: {
        navy: {
          950: '#070C18',
          900: '#0B132B',
          850: '#0F1A38',
          800: '#111C38',
          700: '#162447',
          600: '#1F3864', // Primary Operations Navy
          500: '#2A4980',
          400: '#3B64A6',
        },
        amber: {
          500: '#B7791F', // Amber Accent
          400: '#D68C27',
          300: '#F59E0B',
          600: '#945F16',
        },
        police: {
          gold: '#D4AF37',
          badge: '#1E3A8A',
          alert: '#EF4444',
          safe: '#10B981',
        }
      },
      boxShadow: {
        'ops-panel': '0 4px 20px -2px rgba(7, 12, 24, 0.6), 0 0 1px 1px rgba(31, 56, 100, 0.3)',
        'ops-glow': '0 0 15px rgba(183, 121, 31, 0.25)',
      }
    },
  },
  plugins: [],
}
