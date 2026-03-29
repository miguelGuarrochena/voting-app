/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#3b82f6', // blue-500
          600: '#2563eb', // blue-600
        },
      },
    },
  },
  plugins: [],
}
