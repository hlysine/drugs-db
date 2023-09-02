/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: '#0891b2',
          secondary: '#f59e0b',
          accent: '#a78bfa',
          neutral: '#cffafe',
          'base-100': '#f3f4f6',
          info: '#4daecb',
          success: '#21a172',
          warning: '#ea9739',
          error: '#fb181c',
        },
      },
      {
        dark: {
          primary: '#0891b2',
          secondary: '#f59e0b',
          accent: '#a78bfa',
          neutral: '#1f2937',
          'base-100': '#111827',
          info: '#4daecb',
          success: '#21a172',
          warning: '#ea9739',
          error: '#fb181c',
        },
      },
    ],
  },
  plugins: [require('daisyui')],
};
