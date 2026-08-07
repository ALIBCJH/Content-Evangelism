import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Editorial pairing: Newsreader carries the masthead & headlines,
        // Gentium Book Plus carries running text (it is the reading face,
        // and therefore the body default), IBM Plex Sans carries kickers,
        // navigation, and UI chrome.
        display: ['var(--font-newsreader)', 'Georgia', 'Times New Roman', 'serif'],
        serif: ['var(--font-gentium)', 'Georgia', 'serif'],
        sans: ['var(--font-plex)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Navy chrome: the nav, the footer, and the solid buttons.
        navy: {
          DEFAULT: '#123563', // --blue
          50: '#2A4E7E',
          100: '#1B4177',
          200: '#123563',
          300: '#0F2A50',
          900: '#0C1E3A', // --deep
        },
        // Gold is paint at DEFAULT and ink at .ink — see globals.css.
        gold: {
          DEFAULT: '#D4A017',
          ink: '#8A6410',
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
        // Paper: the linen ground and the cloth an article is printed on.
        linen: '#F1F2F4',
        sand: '#E4E7EC',
        cloth: '#FFFFFF',
        thread: '#D6DAE1',
        sky: '#8FB4DE',
        panel: 'rgb(var(--panel-rgb) / <alpha-value>)',
        canvas: 'rgb(var(--app-bg-rgb) / <alpha-value>)',
      },
      maxWidth: {
        shell: 'var(--shell)',
      },
      boxShadow: {
        'glow-gold': '0 1px 2px rgba(12,30,58,0.10), 0 8px 22px -12px rgba(12,30,58,0.35)',
        'glow-soft': 'var(--shadow-panel)',
        card: 'var(--card-shadow)',
      },
      letterSpacing: {
        kicker: '0.19em',
        masthead: '0.01em',
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
