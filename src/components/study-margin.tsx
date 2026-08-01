'use client'

import * as React from 'react'
import { Check, Link2 } from 'lucide-react'
import type { Heading } from '@/lib/toc'
import { WhatsAppIcon } from '@/components/brand-icons'

/**
 * The study margin: a desktop-only rail beside the article that turns the
 * empty left column into a companion — chapter list (scroll-spy'd), how
 * far you've read, and quick sharing. Chapter clicks first ask the
 * reading gate to open (via the 'rptw:reveal' event), then glide to the
 * heading once the unfold has begun.
 */
export function StudyMargin({ headings, title }: { headings: Heading[]; title: string }) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [percent, setPercent] = React.useState(0)
  const [copied, setCopied] = React.useState(false)

  // Reading progress — same measure the top bar uses.
  React.useEffect(() => {
    let ticking = false
    const measure = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      setPercent(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(measure)
      }
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll-spy: the last heading above the viewport's upper third leads.
  React.useEffect(() => {
    if (headings.length === 0) return
    let ticking = false
    const spy = () => {
      const line = window.innerHeight * 0.33
      let current: string | null = null
      for (const heading of headings) {
        const el = document.getElementById(heading.id)
        if (el && el.getBoundingClientRect().top <= line) current = heading.id
      }
      setActiveId(current)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(spy)
      }
    }
    spy()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  const goTo = (id: string) => {
    window.dispatchEvent(new Event('rptw:reveal'))
    // Travel only after the gate's 0.8s unfold settles — scrolling while
    // the page height is still animating lands short of the heading.
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 850)
  }

  const share = () => {
    const url = window.location.href
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — nothing to do */
    }
  }

  return (
    <div className="w-56">
      {headings.length > 0 && (
        <nav aria-label="In this article">
          <p className="kicker text-gold">In this teaching</p>
          <ol className="mt-4 space-y-1 border-l border-hairline">
            {headings.map((heading) => {
              const active = heading.id === activeId
              return (
                <li key={heading.id}>
                  <button
                    type="button"
                    onClick={() => goTo(heading.id)}
                    className={`focus-ring -ml-px block w-full border-l-2 py-1.5 pl-4 pr-2 text-left font-sans text-[0.8125rem] leading-snug transition-colors ${
                      active
                        ? 'border-gold font-semibold text-ink-strong'
                        : 'border-transparent text-ink-muted hover:border-hairline-strong hover:text-ink'
                    }`}
                  >
                    {heading.text}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      <div className={headings.length > 0 ? 'mt-8 border-t border-hairline pt-6' : ''}>
        <div className="flex items-baseline justify-between">
          <p className="kicker text-ink-subtle">Your reading</p>
          <span className="tabular font-sans text-xs font-semibold text-gold">{percent}%</span>
        </div>
        <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-gold transition-[width] duration-200" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="mt-8 border-t border-hairline pt-6">
        <p className="kicker text-ink-subtle">Pass it on</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={share}
            aria-label="Share on WhatsApp"
            className="focus-ring icon-only grid h-10 w-10 place-items-center rounded-full border border-[#25D366]/50 bg-[#25D366]/15 text-[#25D366] transition-transform hover:scale-105"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy link"
            className="focus-ring icon-only grid h-10 w-10 place-items-center rounded-full border border-hairline-strong bg-surface-2 text-ink-muted transition-transform hover:scale-105 hover:text-gold"
          >
            {copied ? <Check className="h-4 w-4 text-status-success" /> : <Link2 className="h-4 w-4" />}
          </button>
          {copied && <span className="font-sans text-xs text-status-success">Copied</span>}
        </div>
      </div>
    </div>
  )
}
