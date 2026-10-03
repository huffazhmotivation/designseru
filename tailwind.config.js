/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(${v}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ds-ui', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ds-mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        app: c('--c-app'),
        panel: c('--c-panel'),
        canvas: c('--c-canvas'),
        line: c('--c-border'),
        ink: c('--c-text'),
        muted: c('--c-muted'),
        faint: c('--c-faint'),
        accent: c('--c-accent'),
        'on-accent': c('--c-on-accent'),
        sel: c('--c-sel'),
        cyan: c('--c-cyan'),
        field: c('--c-input'),
        hover: c('--c-hover'),
        /* bar mengambang di atas kanvas (tinta) */
        bar: c('--c-bar'),
        'bar-2': 'rgb(var(--c-bar-2))',
        'bar-line': 'rgb(var(--c-bar-line))',
        'bar-ink': c('--c-bar-text'),
        'bar-muted': c('--c-bar-muted'),
        ok: '#3FA37A',
        warn: '#D99A2B',
        err: '#D14343',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['11px', '16px'],
        sm: ['12px', '18px'],
        base: ['13px', '20px'],
      },
      borderRadius: { ctl: '7px', bar: '12px' },
      boxShadow: {
        soft: '0 1px 2px rgb(14 20 16 / 0.05), 0 4px 14px -4px rgb(14 20 16 / 0.08)',
        pop: '0 1px 2px rgb(14 20 16 / 0.06), 0 16px 40px -12px rgb(14 20 16 / 0.22)',
        bar: '0 1px 0 rgb(255 255 255 / 0.05) inset, 0 2px 4px rgb(0 0 0 / 0.10), 0 12px 28px -10px rgb(0 0 0 / 0.40)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    },
  },
  plugins: [],
};
