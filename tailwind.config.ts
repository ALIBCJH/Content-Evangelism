import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Editorial pairing: Fraunces carries the masthead & headlines,
        // Newsreader carries deks/excerpts, Montserrat (the Altar brand
        // sans) carries kickers, navigation and UI chrome.
        display: ['var(--font-fraunces)', 'Georgia', 'Times New Roman', 'serif'],
        serif: ['var(--font-newsreader)', 'Georgia', 'serif'],
        sans: ['var(--font-montserrat)', 'Segoe UI Variable', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#0F172A',
          50: '#1E293B',
          100: '#1A243F',
          200: '#141B2E',
          300: '#0F172A',
          900: '#070B16',
        },
        gold: {
          DEFAULT: '#D4A017',
          dark: '#B8860B',
          light: '#E8B923',
          50: '#FBF7E8',
          400: '#E8B923',
          500: '#D4A017',
          600: '#B8860B',
        },
        flagship: {
          DEFAULT: 'rgb(var(--flagship-rgb) / <alpha-value>)',
          deep: 'rgb(var(--flagship-deep-rgb) / <alpha-value>)',
          soft: 'rgb(var(--flagship-soft-rgb) / <alpha-value>)',
        },
        orchid: 'rgb(var(--orchid-rgb) / <alpha-value>)',
        status: {
          success: 'rgb(var(--success-rgb) / <alpha-value>)',
          warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
          danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
          info: 'rgb(var(--info-rgb) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink-rgb) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--ink-subtle-rgb) / <alpha-value>)',
          strong: 'rgb(var(--ink-strong-rgb) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        hairline: {
          DEFAULT: 'var(--hairline)',
          strong: 'var(--hairline-strong)',
        },
        panel: 'rgb(var(--panel-rgb) / <alpha-value>)',
        canvas: 'rgb(var(--app-bg-rgb) / <alpha-value>)',
      },
      boxShadow: {
        'glow-gold': '0 0 0 1px rgba(212,160,23,0.35), 0 8px 30px -10px rgba(212,160,23,0.45)',
        'glow-soft': 'var(--shadow-panel)',
        card: 'var(--card-shadow)',
      },
      letterSpacing: {
        kicker: '0.18em',
        masthead: '0.06em',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        shimmer: 'shimmer 2.4s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
      },
    },
  },
  plugins: [],
}
export default config
