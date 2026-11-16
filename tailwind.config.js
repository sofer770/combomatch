/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'), surface: v('surface'), cream: v('cream'), line: v('line'),
        ink: v('ink'), muted: v('muted'),
        leaf: { DEFAULT: v('leaf'), dark: v('leaf-dark'), soft: v('leaf-soft') },
        earth: { DEFAULT: v('earth'), soft: v('earth-soft') },
        ok: { DEFAULT: v('ok'), soft: v('ok-soft') },
        warn: { DEFAULT: v('warn'), soft: v('warn-soft') },
        bad: { DEFAULT: v('bad'), soft: v('bad-soft') },
        unk: { DEFAULT: v('unk'), soft: v('unk-soft') },
      },
      fontFamily: { sans: ['Rubik', 'Assistant', 'system-ui', 'sans-serif'] },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: { card: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(60 80 40 / 0.07)' },
      keyframes: { pop: { '0%': { transform: 'scale(.96)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } } },
      animation: { pop: 'pop .22s ease-out' },
    },
  },
  darkMode: ['variant', ['@media (prefers-color-scheme: dark) { &:where(:root:not([data-theme=light]) *) }', '&:where([data-theme=dark] *)']],
  plugins: [],
};
