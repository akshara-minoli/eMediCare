/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#22C55E', // Premium Green
          dark: '#16a34a',
          light: '#dcfce7',
        },
        secondary: {
          DEFAULT: '#22C55E', 
          dark: '#16a34a',
        },
        bg: {
          DEFAULT: '#0A192F', // Dark Blue
          2: '#0D1B2A',
          surface: '#112240', // Deep Navy
          surface2: '#1B263B',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4f6ef7 0%, #7c5cf6 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0a0f1e 0%, #161e3a 50%, #0a1628 100%)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(79,110,247,0.25)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease both',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
