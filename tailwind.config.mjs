/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        gradient: {
          purple: '#6B46C1',
          teal: '#0891B2',
          cyan: '#06B6D4',
          orange: '#F97316',
          pink: '#EC4899',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

