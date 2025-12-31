/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fcf3f8',
          100: '#fbebf3',
          200: '#fbd2e9',
          300: '#f4add6',
          400: '#e97bb9',
          500: '#cf337c',
          600: '#b0268b',
          700: '#942d52',
          800: '#7c1f46',
          900: '#5a1832',
          950: '#4b0c27',
        },
        background: 'var(--background)',
        'background-subtle': 'var(--background-subtle)',
        foreground: 'var(--foreground)',
        'foreground-muted': 'var(--foreground-muted)',
        card: 'var(--card)',
        'card-hover': 'var(--card-hover)',
        'card-foreground': 'var(--card-foreground)',
        muted: 'var(--muted)',
        'muted-hover': 'var(--muted-hover)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
};
