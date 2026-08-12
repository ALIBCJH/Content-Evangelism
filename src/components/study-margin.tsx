'use client'

import * as React from 'react'
import { Check, Link2 } from 'lucide-react'
import type { Heading } from '@/lib/toc'
import { WhatsAppIcon } from '@/components/brand-icons'

/**
 * The study margin: a desktop rail beside the article that turns the once
 * empty left column into a reading companion — the chapter list, how far
 * through you are, and the two ways to pass it on.
 *
 * The chapters are anchors, not buttons. They used to be buttons because
 * the body was collapsed behind a reading gate and had to be asked to
 * open before anything could be scrolled to; with the gate gone the whole
 * teaching is simply on the page, so an `href="#chapter"` does the work —
 * and does it for a crawler, a keyboard, and a middle click too, none of
 * which a click handler serves.
 *
 * Only the state is client-side: which chapter is in view, and how far
 * down the page the reader has come.
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
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
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

  /* One chapter is not a structure worth printing — the same threshold
     ArticleContents applies, so the rail and the in-flow list agree. */
  const hasChapters = headings.length > 1

  return (
    <div className="w-56">
      {hasChapters && (
        <nav aria-label="In this teaching">
          <p className="kicker text-gold">In this teaching</p>
          <ol className="mt-4 border-l border-hairline">
            {headings.map((heading, index) => {
              const active = heading.id === activeId
              return (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    /* The gold edge is the position marker, but colour is
                       never the only signal — the active chapter is also
                       the only one set in the strong ink, and it is the
                       one the page is currently on. */
                    aria-current={active ? 'true' : undefined}
                    className={`focus-ring -ml-px flex items-baseline gap-2.5 border-l-2 py-1.5 pl-4 pr-2 font-sans text-[0.8125rem] leading-snug transition-colors ${
                      active
                        ? 'border-gold font-semibold text-ink-strong'
                        : 'border-transparent text-ink-muted hover:border-hairline-strong hover:text-ink'
                    }`}
                  >
                    <span aria-hidden className="tabular text-[0.6875rem] text-ink-subtle">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">{heading.text}</span>
                  </a>
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      <div className={hasChapters ? 'mt-8 border-t border-hairline pt-6' : ''}>
        <div className="flex items-baseline justify-between">
          <p className="kicker text-ink-subtle">Your reading</p>
          <span className="tabular font-sans text-xs font-semibold text-gold">{percent}%</span>
        </div>
        <div
          className="mt-3 h-[3px] overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-label="Reading progress"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
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
          <span aria-live="polite" className="font-sans text-xs text-status-success">
            {copied ? 'Copied' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
