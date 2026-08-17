'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { searchDocs, type SearchDoc } from '@/lib/search-docs'

/**
 * The search overlay: a sheet over the page holding one field and the
 * results beneath it, live as you type.
 *
 * The whole index is already on the client, so a keystroke is answered
 * without a request. Escape and the backdrop both dismiss it, focus moves
 * into the field on open and back to the opener on close, and the page
 * behind it is held still. "All results →" hands off to /search, which is
 * the crawlable, linkable version of the same thing.
 */
export function SearchOverlay({
  docs,
  open,
  onClose,
}: {
  docs: SearchDoc[]
  open: boolean
  onClose: () => void
}) {
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  React.useEffect(() => {
    if (!open) return
    const { body } = document
    const gap = window.innerWidth - document.documentElement.clientWidth
    const overflow = body.style.overflow
    const padding = body.style.paddingRight
    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${gap}px`
    return () => {
      body.style.overflow = overflow
      body.style.paddingRight = padding
    }
  }, [open])

  if (!open) return null

  const hits = searchDocs(docs, query)
  const shown = hits.slice(0, 8)

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-center bg-plate-deep/70 px-6 pt-[88px]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="flex max-h-full w-full max-w-[780px] flex-col self-start overflow-hidden rounded-panel bg-raised shadow-[0_32px_80px_rgba(13,44,70,0.30)]"
      >
        <div className="flex items-center gap-3.5 border-b border-rule px-6 py-5">
          <Search aria-hidden className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search teachings, Scriptures, prophecies, sermons…"
            aria-label="Search the archive"
            className="min-w-0 flex-1 border-0 bg-transparent text-[1.1875rem] text-ink outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="icon-only rounded-md border border-rule px-2 py-1 font-mono text-[0.6875rem] text-ink-subtle transition-colors hover:text-ink"
          >
            ESC
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {shown.length === 0 ? (
            <p className="px-6 py-8 text-[0.9375rem] text-ink-500">
              Nothing matches “{query}”. Try a book of the Bible, a nation, or a subject.
            </p>
          ) : (
            shown.map((doc) => (
              <Link
                key={doc.href}
                href={doc.href}
                onClick={onClose}
                className="block border-b border-rule-soft px-6 py-4 transition-colors last:border-b-0 hover:bg-chip"
              >
                <span className="mb-1.5 flex items-center gap-2.5">
                  <span className="kicker rounded-chip bg-chip-blue px-2.5 py-1 text-navy">
                    {doc.kind}
                  </span>
                  <span className="font-mono text-[0.6875rem] text-ink-subtle">{doc.date}</span>
                </span>
                <span className="block font-display text-[1.3125rem] font-medium leading-tight text-navy">
                  {doc.title}
                </span>
                <span className="mt-1 text-[0.8125rem] leading-relaxed text-ink-500 line-clamp-2">
                  {doc.excerpt}
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-rule bg-ground px-6 py-3.5">
          <span className="text-xs text-ink-subtle">
            {hits.length} {hits.length === 1 ? 'result' : 'results'}
          </span>
          <Link
            href={query ? `/search?q=${encodeURIComponent(query)}` : '/search'}
            onClick={onClose}
            className="font-mono text-[0.6875rem] tracking-[0.08em] text-navy transition-colors hover:text-gold"
          >
            ALL RESULTS →
          </Link>
        </div>
      </div>
    </div>
  )
}
