/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0f',
          card: '#12121a',
          border: '#1a1a25',
          text: '#e4e4e7',
          muted: '#71717a',
        },
        purple: {
          glow: '#7c3aed',
        },
        blue: {
          glow: '#2563eb',
        },
        slate: {
          950: '#03071e',
          900: '#0b0e27',
          850: '#1a1f3a',
          800: '#2d3561',
          700: '#3f4881',
          600: '#4f5fa1',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideUp: 'slideUp 0.5s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s infinite',
        spin: 'spin 1s linear infinite',
        bounce: 'bounce 1s infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '1000% 0' },
          '100%': { backgroundPosition: '-1000% 0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(124, 58, 237, 0.8)' },
        },
      },
      boxShadow: {
        glow: '0 0 30px rgba(124, 58, 237, 0.5)',
        'glow-lg': '0 0 40px rgba(124, 58, 237, 0.6)',
      },
    },
  },
  plugins: [],
}
