import { tailwindColors } from './src/styles/theme.ts';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: tailwindColors,
      fontFamily: {
        sans: ['"Exo 2"', 'system-ui', '-apple-system', 'sans-serif'],
        decorative: ['"Grand Hotel"', 'cursive'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'soft': '0 1px 2px rgba(0, 0, 0, 0.02)',
        'dark': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'focus': '0 0 0 3px rgba(23, 23, 23, 0.1)',
      },
      transitionDuration: {
        '240': '240ms',
        '320': '320ms',
      },
    },
  },
  plugins: [],
};
