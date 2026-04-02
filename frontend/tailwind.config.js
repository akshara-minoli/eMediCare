/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary:   {
          DEFAULT: '#4f6ef7',
          dark:    '#3a56e0',
          light:   '#e8ecff',
        },
        secondary: {
          DEFAULT: '#10b981',
          dark:    '#059669',
        },
        bg: {
          DEFAULT: '#0a0f1e',
          2:       '#0f1629',
          surface: '#151d35',
          surface2:'#1c2645',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4f6ef7 0%, #7c5cf6 100%)',
        'gradient-hero':    'linear-gradient(135deg, #0a0f1e 0%, #161e3a 50%, #0a1628 100%)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(79,110,247,0.25)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease both',
        'float':   'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
