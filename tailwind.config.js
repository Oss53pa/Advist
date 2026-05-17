import { tailwindColors } from './src/styles/theme.ts';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: tailwindColors,
      fontFamily: {
        sans: ['"Dosis"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Dosis"', 'system-ui', 'sans-serif'],
        decorative: ['"Grand Hotel"', 'cursive'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '10px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.04)',
        'soft': '0 1px 2px rgba(0,0,0,0.03)',
        'elevated': '0 8px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        'dark': '0 4px 12px rgba(0,0,0,0.12)',
        'focus': '0 0 0 3px rgba(99,102,241,0.15)',
        'premium': '0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(99,102,241,0.06)',
      },
      transitionDuration: {
        '240': '240ms',
        '320': '320ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
