import type { Config } from 'tailwindcss'

/* The palette, the type, and the geometry all come from the Ministry
   Platform design — see docs/design/ministry-platform.md. Token names in
   the old scheme (linen, sand, cloth, thread, sky, hairline…) are kept as
   aliases so nothing renders unstyled, but new work should use the names
   below: ground / raised / card / rule / chip, navy, gold, ink. */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Fraunces carries every headline, standfirst, and pull quote;
        // Inter carries running text and UI; JetBrains Mono carries the
        // kickers, datelines, and scripture references.
        display: ['var(--font-fraunces)', 'Georgia', 'Times New Roman', 'serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],

        // ── The reading layer ────────────────────────────────────
        // An article is set in its own three faces, not the chrome's.
        // Serif for what you read, sans for what you scan.
        //   article    Newsreader — headline, standfirst, chapter heads
        //   reading    Gentium Book Plus — body copy and Scripture
        //   apparatus  IBM Plex Sans — meta, rail, citations, questions
        article: ['var(--font-newsreader)', 'Georgia', 'Times New Roman', 'serif'],
        reading: ['var(--font-gentium)', 'Georgia', 'Times New Roman', 'serif'],
        apparatus: ['var(--font-plex)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        /* ── Paper ─────────────────────────────────────────────── */
        ground: '#F7F4EC',
        raised: '#FBF9F3',
        card: '#FFFDF8',
        rule: { DEFAULT: '#E4DED0', soft: '#EDE7DA', strong: '#D8CFBA' },
        chip: { DEFAULT: '#F1EDE1', blue: '#EAF0F6', gold: '#F4EBD3' },

        /* ── Navy ──────────────────────────────────────────────── */
        navy: {
          DEFAULT: '#123B5D',
          deep: '#0D2C46',
          rule: '#1D4568',
          soft: '#9FB4C8',
          pale: '#C8D6E4',
          50: '#2A4E7E',
          100: '#1B4177',
          200: '#123B5D',
          300: '#0D2C46',
          900: '#0D2C46',
        },

        /* ── Gold ──────────────────────────────────────────────── */
        gold: {
          DEFAULT: '#B8944A',
          light: '#C9A961',
          pale: '#D8C48E',
          sand: '#E3CE96',
          ink: '#7A5F1E',
          dark: '#7A5F1E',
          50: '#F4EBD3',
        },

        /* ── Ink ───────────────────────────────────────────────── */
        ink: {
          DEFAULT: '#14202B',
          strong: '#123B5D',
          900: '#26333F',
          700: '#40505E',
          muted: '#5C6B7A',
          500: '#5C6B7A',
          subtle: '#8B98A5',
          400: '#8B98A5',
        },

        fulfilled: { DEFAULT: '#1E7A4E', navy: '#23935E' },

        status: {
          success: '#1E7A4E',
          warning: '#7A5F1E',
          danger: '#BE123C',
          info: '#123B5D',
        },

        /* Aliases from the previous theme. */
        linen: '#F7F4EC',
        sand: '#F1EDE1',
        cloth: '#FFFDF8',
        thread: '#E4DED0',
        sky: '#9FB4C8',
        panel: '#FFFDF8',
        canvas: '#F7F4EC',
        flagship: { DEFAULT: '#123B5D', deep: '#0D2C46', soft: '#9FB4C8' },
        orchid: '#6D28D9',
        surface: { DEFAULT: 'var(--surface-1)', 2: 'var(--surface-2)', 3: 'var(--surface-3)' },
        hairline: { DEFAULT: '#E4DED0', strong: '#D8CFBA' },
      },
      maxWidth: {
        shell: 'var(--shell)',
        measure: 'var(--measure)',
        read: 'var(--read)',
      },
      borderRadius: {
        chip: '999px',
        tile: '12px',
        figure: '14px',
        panel: '16px',
      },
      spacing: {
        stick: 'var(--stick)',
      },
      boxShadow: {
        'glow-gold': '0 2px 8px rgba(184,148,74,0.30)',
        'glow-soft': 'var(--shadow-panel)',
        card: 'var(--card-shadow-hover)',
        drawer: '-24px 0 60px -20px rgba(13,44,70,0.65)',
      },
      letterSpacing: {
        kicker: '0.14em',
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
