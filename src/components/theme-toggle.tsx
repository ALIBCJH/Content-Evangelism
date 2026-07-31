'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Dark = the candlelit navy edition (default). Light = the paper edition.
 * The inline script in layout.tsx applies the stored class before paint.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark')

  React.useEffect(() => {
    setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark')
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(next)
    try {
      localStorage.setItem('herald-theme', next)
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to the paper edition (light mode)' : 'Switch to the evening edition (dark mode)'}
      className={cn(
        'focus-ring icon-only grid h-9 w-9 place-items-center rounded-full border border-hairline text-ink-muted',
        'transition-colors hover:border-gold/50 hover:text-gold',
        className
      )}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
