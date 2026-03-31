/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF4D6A',
        'primary-light': '#FFE4E9',
        'primary-dark': '#E63050',
        bg: '#FFF8F5',
        surface: '#FFFFFF',
        'surface-2': '#F5EDE9',
        text: '#1A1523',
        'text-muted': '#8B7B87',
        border: '#EAE0DC',
        success: '#2DD4A0',
        warning: '#FFB347',
        error: '#EF4444',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'shadow-sm': '0 2px 8px rgba(26,21,35,0.06)',
        'shadow-md': '0 8px 24px rgba(26,21,35,0.10)',
        'shadow-lg': '0 20px 48px rgba(26,21,35,0.14)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-occasional': 'spinOccasional 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        spinOccasional: {
          '0%, 70%': { transform: 'rotate(0deg)' },
          '75%': { transform: 'rotate(90deg)' },
          '80%': { transform: 'rotate(180deg)' },
          '85%': { transform: 'rotate(270deg)' },
          '90%': { transform: 'rotate(360deg)' },
          '95%, 100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
