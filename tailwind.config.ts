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
        /* Every colour resolves through a CSS variable, so a utility and
           its opacity modifier — bg-plate/80 — both follow the theme. The
           <alpha-value> placeholder is what Tailwind substitutes when a
           modifier is present, and 1 when it is not. */

        /* ── Paper ─────────────────────────────────────────────── */
        ground: 'rgb(var(--ground-rgb) / <alpha-value>)',
        raised: 'rgb(var(--raised-rgb) / <alpha-value>)',
        card: 'rgb(var(--card-rgb) / <alpha-value>)',
        rule: {
          DEFAULT: 'rgb(var(--rule-rgb) / <alpha-value>)',
          soft: 'rgb(var(--rule-soft-rgb) / <alpha-value>)',
          strong: 'rgb(var(--rule-strong-rgb) / <alpha-value>)',
        },
        chip: {
          DEFAULT: 'rgb(var(--chip-rgb) / <alpha-value>)',
          blue: 'rgb(var(--chip-blue-rgb) / <alpha-value>)',
          gold: 'rgb(var(--chip-gold-rgb) / <alpha-value>)',
        },

        /* ── Navy: the ink a heading is set in ─────────────────── */
        navy: {
          DEFAULT: 'rgb(var(--navy-rgb) / <alpha-value>)',
          /* The plate, under the names it went by before it had one of
             its own. New work should say plate. */
          deep: 'rgb(var(--plate-deep-rgb) / <alpha-value>)',
          rule: 'rgb(var(--plate-rule-rgb) / <alpha-value>)',
          soft: 'rgb(var(--plate-soft-rgb) / <alpha-value>)',
          pale: 'rgb(var(--plate-pale-rgb) / <alpha-value>)',
          50: 'rgb(var(--plate-rule-rgb) / <alpha-value>)',
          100: 'rgb(var(--plate-rgb) / <alpha-value>)',
          200: 'rgb(var(--plate-rgb) / <alpha-value>)',
          300: 'rgb(var(--plate-deep-rgb) / <alpha-value>)',
          900: 'rgb(var(--plate-deep-rgb) / <alpha-value>)',
        },

        /* ── Plate: the ministry's navy panel ──────────────────── */
        plate: {
          DEFAULT: 'rgb(var(--plate-rgb) / <alpha-value>)',
          deep: 'rgb(var(--plate-deep-rgb) / <alpha-value>)',
          rule: 'rgb(var(--plate-rule-rgb) / <alpha-value>)',
          soft: 'rgb(var(--plate-soft-rgb) / <alpha-value>)',
          pale: 'rgb(var(--plate-pale-rgb) / <alpha-value>)',
        },

        /* ── Gold ──────────────────────────────────────────────── */
        gold: {
          DEFAULT: 'rgb(var(--gold-rgb) / <alpha-value>)',
          light: 'rgb(var(--gold-light-rgb) / <alpha-value>)',
          pale: 'rgb(var(--gold-pale-rgb) / <alpha-value>)',
          sand: 'rgb(var(--gold-sand-rgb) / <alpha-value>)',
          ink: 'rgb(var(--gold-ink-rgb) / <alpha-value>)',
          dark: 'rgb(var(--gold-ink-rgb) / <alpha-value>)',
          50: 'rgb(var(--chip-gold-rgb) / <alpha-value>)',
        },

        /* ── The primary call to action ────────────────────────── */
        cta: {
          DEFAULT: 'rgb(var(--cta-rgb) / <alpha-value>)',
          hover: 'rgb(var(--cta-hover-rgb) / <alpha-value>)',
          ink: 'rgb(var(--cta-ink-rgb) / <alpha-value>)',
        },

        /* ── Ink ───────────────────────────────────────────────── */
        ink: {
          DEFAULT: 'rgb(var(--ink-rgb) / <alpha-value>)',
          strong: 'rgb(var(--navy-rgb) / <alpha-value>)',
          900: 'rgb(var(--ink-900-rgb) / <alpha-value>)',
          700: 'rgb(var(--ink-700-rgb) / <alpha-value>)',
          muted: 'rgb(var(--ink-500-rgb) / <alpha-value>)',
          500: 'rgb(var(--ink-500-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--ink-400-rgb) / <alpha-value>)',
          400: 'rgb(var(--ink-400-rgb) / <alpha-value>)',
        },

        /* The pastoral care band, which speaks in the ministry's own
           voice and so carries its own set rather than the page's. */
        care: {
          DEFAULT: 'rgb(var(--care-bg-rgb) / <alpha-value>)',
          rule: 'rgb(var(--care-rule-rgb) / <alpha-value>)',
          tile: 'rgb(var(--care-tile-rgb) / <alpha-value>)',
          head: 'rgb(var(--care-head-rgb) / <alpha-value>)',
          body: 'rgb(var(--care-body-rgb) / <alpha-value>)',
          mark: 'rgb(var(--care-mark-rgb) / <alpha-value>)',
        },
        /* ── The teaching's editorial panels ───────────────────── */
        statement: {
          bg: 'rgb(var(--statement-bg-rgb) / <alpha-value>)',
          rule: 'rgb(var(--statement-rule-rgb) / <alpha-value>)',
        },
        source: {
          bg: 'rgb(var(--source-bg-rgb) / <alpha-value>)',
          rule: 'rgb(var(--source-rule-rgb) / <alpha-value>)',
          ink: 'rgb(var(--source-ink-rgb) / <alpha-value>)',
          label: 'rgb(var(--source-label-rgb) / <alpha-value>)',
          cite: 'rgb(var(--source-cite-rgb) / <alpha-value>)',
        },

        fulfilled: {
          DEFAULT: 'rgb(var(--fulfilled-rgb) / <alpha-value>)',
          navy: 'rgb(var(--fulfilled-navy-rgb) / <alpha-value>)',
        },

        status: {
          success: 'rgb(var(--fulfilled-rgb) / <alpha-value>)',
          warning: 'rgb(var(--gold-ink-rgb) / <alpha-value>)',
          danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
          info: 'rgb(var(--navy-rgb) / <alpha-value>)',
        },

        /* Aliases from the previous theme. */
        linen: 'rgb(var(--ground-rgb) / <alpha-value>)',
        sand: 'rgb(var(--chip-rgb) / <alpha-value>)',
        cloth: 'rgb(var(--card-rgb) / <alpha-value>)',
        thread: 'rgb(var(--rule-rgb) / <alpha-value>)',
        sky: 'rgb(var(--plate-soft-rgb) / <alpha-value>)',
        panel: 'rgb(var(--card-rgb) / <alpha-value>)',
        canvas: 'rgb(var(--ground-rgb) / <alpha-value>)',
        flagship: {
          DEFAULT: 'rgb(var(--plate-rgb) / <alpha-value>)',
          deep: 'rgb(var(--plate-deep-rgb) / <alpha-value>)',
          soft: 'rgb(var(--plate-soft-rgb) / <alpha-value>)',
        },
        orchid: 'rgb(var(--orchid-rgb) / <alpha-value>)',
        surface: { DEFAULT: 'var(--surface-1)', 2: 'var(--surface-2)', 3: 'var(--surface-3)' },
        hairline: {
          DEFAULT: 'rgb(var(--rule-rgb) / <alpha-value>)',
          strong: 'rgb(var(--rule-strong-rgb) / <alpha-value>)',
        },
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
        /* The read-more button on a phone: a slow breath, not a blink. */
        ember: 'ember 2.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
        ember: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(249 115 22 / 0.45), 0 6px 16px -4px rgb(234 88 12 / 0.55)' },
          '50%': { boxShadow: '0 0 0 6px rgb(249 115 22 / 0), 0 8px 22px -4px rgb(234 88 12 / 0.75)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
