import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'forest-dark': 'var(--color-primary)',
        charcoal: 'var(--color-text-primary)',
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        slate: 'rgba(100, 116, 139, <alpha-value>)',
        cream: 'rgba(248, 250, 247, <alpha-value>)',
        forest: 'rgba(45, 95, 63, <alpha-value>)',
        sage: 'rgba(112, 140, 120, <alpha-value>)',
        moss: 'rgba(74, 124, 89, <alpha-value>)',
        leaf: 'rgba(45, 95, 63, <alpha-value>)',
        'leaf-light': 'rgba(100, 140, 120, <alpha-value>)',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        input: 'var(--radius-input)',
        button: 'var(--radius-button)',
        card: 'var(--radius-card)',
        modal: 'var(--radius-modal)',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        elevated: 'var(--shadow-elevated)',
        soft: 'var(--shadow-subtle)',
      },
    },
  },
  plugins: [],
};
export default config;
