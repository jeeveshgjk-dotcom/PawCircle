/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#f2f5f2',
          100: '#d9e8d9',
          200: '#b3d1b3',
          300: '#84a98c',
          400: '#5a8a65',
          500: '#3d6b47',
          600: '#2d5236',
          700: '#1f3a26',
          800: '#132318',
          900: '#0a130d',
        },
        cream: '#fefae0',
        peach: {
          50:  '#fef3ec',
          100: '#fde8d8',
          200: '#fbd0b0',
          300: '#f8b088',
          400: '#f4a261',
          500: '#e07a3d',
          600: '#c45e28',
          700: '#9e461a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

