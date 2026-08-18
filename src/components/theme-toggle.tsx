'use client'

import * as React from 'react'

/**
 * Light or dark, and which one a reader gets on arrival.
 *
 * The rule is that the site follows the operating system until a reader
 * says otherwise, and remembers the saying. So there are three states,
 * not two: no stored choice, stored light, stored dark. The first one is
 * what most readers are in, and it is the one a plain boolean loses.
 *
 * The theme itself is applied before this component ever mounts — the
 * script in the root layout stamps `data-theme` on <html> in the head, so
 * a reader who prefers dark never sees a white page flash. All this
 * button does is change that attribute and write down the reason.
 *
 * It renders nothing on the server and nothing on the first client pass:
 * the true state is in localStorage, which the server cannot know, and a
 * button drawn from a guess would show a sun to half the readers holding
 * a moon. Reserving the space it will occupy keeps the masthead from
 * moving when it arrives.
 */

const STORAGE_KEY = 'theme'

type Theme = 'light' | 'dark'

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme | null>(null)

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    setTheme(stored === 'light' || stored === 'dark' ? stored : systemTheme())

    /* A reader who has expressed no preference here still follows the
       system, so a change made in the OS while the page is open is
       honoured rather than waiting for a reload. */
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (window.localStorage.getItem(STORAGE_KEY)) return
      const next = systemTheme()
      document.documentElement.dataset.theme = next
      setTheme(next)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    window.localStorage.setItem(STORAGE_KEY, next)
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
