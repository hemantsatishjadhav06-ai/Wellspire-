/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Wellspire International — nature/biophilic green
        brand: {
          50: '#f0faf3', 100: '#dcf3e3', 200: '#bce7cb', 300: '#8bd4a8',
          400: '#52b97e', 500: '#2c9e5f', 600: '#1c7f49', 700: '#17653c',
          800: '#155032', 900: '#12422b', 950: '#082518',
        },
        gold: {
          50: '#fbf6e9', 100: '#f6eccb', 200: '#edd894', 300: '#e3c05a',
          400: '#d9a92f', 500: '#c8961f', 600: '#a8781a', 700: '#855b18',
          800: '#6f4a1a', 900: '#5f3f1b', 950: '#37220c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 6px -1px rgb(0 0 0 / 0.06)',
        soft: '0 4px 24px -8px rgb(79 70 229 / 0.15)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0, transform: 'translateY(4px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: { 'fade-in': 'fade-in 0.25s ease-out' },
    },
  },
  plugins: [],
};
