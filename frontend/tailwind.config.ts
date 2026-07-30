import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          surface: '#F1F6FF',
          card: '#F5F6F7',
          foreground: '#0A2F46',
          primary: '#0368C3',
          'primary-hover': '#0256A3',
          border: '#D6DFEB',
          muted: '#5A7180',
          'primary-light': '#E8F1FC',
        },
        sidebar: '#FFFFFF',
        'tab-active': '#0368C3',
        'section-accent': '#0368C3',
      },
    },
  },
  plugins: [],
};

export default config;
