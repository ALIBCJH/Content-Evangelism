'use client'

import * as React from 'react'

/**
 * Light or dark, and which one a reader gets on arrival.
 *
 * The rule is that a reader arrives on the light setting and stays there
 * until they say otherwise, and that the saying is remembered. It used to
 * be that the site followed the operating system until a reader said
 * otherwise — the usual advice, and the wrong answer for a publication.
 * The reasoning is in the root layout, beside the script that does the
 * stamping; the short of it is that a machine kept dark is not a request
 * for a dark publication, and this site was reading it as one.
 *
 * So two states rather than three, and the third — "no stored choice" —
 * now resolves to light before this component is ever asked. What follows
 * from that is that nothing here watches the system any more: a reader
 * who has expressed no preference is on light deliberately, and a change
 * made in the OS while the page is open must not move them off it.
 *
 * The theme itself is applied before this component mounts — the script
 * in the root layout stamps `data-theme` on <html> in the head — so a
 * reader who has chosen dark never sees a white flash on a navigation.
 * All this button does is change that attribute and write down the reason.
 *
 * It renders nothing on the server and nothing on the first client pass:
 * the true state is in localStorage, which the server cannot know, and a
 * button drawn from a guess would show a sun to every reader holding a
 * moon. Reserving the space it will occupy keeps the masthead from moving
 * when it arrives.
 */

const STORAGE_KEY = 'theme'

type Theme = 'light' | 'dark'

/** The browser chrome around the page, so it does not stay light behind a
    reader who has chosen dark. The values are the two grounds. */
const CHROME: Record<Theme, string> = { light: '#123B5D', dark: '#0A1A2F' }

function paintChrome(theme: Theme): void {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', CHROME[theme])
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme | null>(null)

  React.useEffect(() => {
    /* Anything that is not an explicit 'dark' is light — the same test the
       stamping script makes, so the button and the page can never disagree
       about what a reader is looking at. */
    setTheme(window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light')
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    window.localStorage.setItem(STORAGE_KEY, next)
    paintChrome(next)
    setTheme(next)
  }

  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      /* Until the stored choice is known the control is inert and
         invisible, but it still occupies its place in the row. */
      aria-hidden={theme === null}
      tabIndex={theme === null ? -1 : undefined}
      aria-pressed={dark}
      aria-label={dark ? 'Switch to the light theme' : 'Switch to the dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
      data-track="theme-toggle"
      className={`focus-ring group relative inline-flex h-9 w-[64px] shrink-0 items-center rounded-chip border border-rule bg-raised px-1 transition-colors hover:border-gold-pale ${
        theme === null ? 'invisible' : ''
      } ${className}`}
    >
      {/* The knob. It carries the icon and slides under it, so the
          two read as one object rather than as a light behind a shade. */}
      <span
        aria-hidden
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-plate text-gold-sand shadow-glow-soft transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          dark ? 'translate-x-[28px]' : 'translate-x-0'
        }`}
      >
        {dark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.4v2.2M12 19.4v2.2M4.2 12H2M22 12h-2.2M5.6 5.6 4 4M20 20l-1.6-1.6M18.4 5.6 20 4M4 20l1.6-1.6" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z" />
    </svg>
  )
}
