'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { searchDocs, type SearchDoc } from '@/lib/search-docs'

/**
 * The search overlay: a sheet over the page holding one field and the
 * results beneath it, live as you type.
 *
 * The index is fetched rather than handed down. It used to arrive as a
 * prop from the reader layout, which meant the full text of every teaching
 * was serialised into every page of the site whether or not anybody ever
 * pressed "/" — see `app/api/search-index/route.ts` for the measurement.
 * Now the first open pays for it once and the module holds it for the rest
 * of the session, so the second open is as instant as the old one and no
 * page carries the cost of a control nobody touched.
 *
 * Escape and the backdrop both dismiss it, focus moves into the field on
 * open and back to the opener on close, and the page behind it is held
 * still. "All results →" hands off to /search, which is the crawlable,
 * linkable version of the same thing — and the one that still works when
 * the fetch below does not.
 *
 * On a phone it is the whole screen. It used to open as a panel inset
 * 88px from the top and 24px from each side, which on a six-inch screen
 * spent a third of the window on the page it was covering; and it is
 * measured in `dvh` rather than `vh`, so the results end where the
 * keyboard begins rather than underneath it.
 */

/* Held for the life of the tab. A reader opens search, closes it, opens it
   again three pages later: that is one download, not three. */
let held: SearchDoc[] | null = null
let inFlight: Promise<SearchDoc[]> | null = null

function loadIndex(): Promise<SearchDoc[]> {
  if (held) return Promise.resolve(held)
  if (!inFlight) {
    inFlight = fetch('/api/search-index')
      .then((response) => {
        if (!response.ok) throw new Error(`search index: ${response.status}`)
        return response.json() as Promise<SearchDoc[]>
      })
      .then((docs) => {
        held = docs
        return docs
      })
      .catch((error) => {
        /* Cleared so a reader who opens search again after the signal
           comes back gets another attempt rather than a cached failure. */
        inFlight = null
        throw error
      })
  }
  return inFlight
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = React.useState('')
  const [docs, setDocs] = React.useState<SearchDoc[] | null>(held)
  const [failed, setFailed] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  /* Fetched on the first open and never again. A reader can type while it
     is in the air; the results appear under what they have already
     written the moment it lands. */
  React.useEffect(() => {
    if (!open || docs) return
    let live = true
    setFailed(false)
    loadIndex().then(
      (loaded) => {
        if (live) setDocs(loaded)
      },
      () => {
        if (live) setFailed(true)
      }
    )
    return () => {
      live = false
    }
  }, [open, docs])

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

  const hits = docs ? searchDocs(docs, query) : []
  const shown = hits.slice(0, 8)
  const loading = !docs && !failed

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-center bg-plate-deep/70 sm:px-6 sm:pt-[88px]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="flex h-[100dvh] w-full max-w-[780px] flex-col overflow-hidden bg-raised shadow-[0_32px_80px_rgba(13,44,70,0.30)] sm:h-auto sm:max-h-[calc(100dvh-88px)] sm:self-start sm:rounded-panel"
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
          {/* A phone has no Escape key, and "ESC" in a 30x22 box was
              neither a legible instruction nor a target a thumb could
              find. The mark is the control below `sm`; the word is kept
              from `sm` up, where it is telling a reader with a keyboard
              something true and useful. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="focus-ring icon-only -mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-subtle transition-colors hover:text-ink sm:mr-0 sm:h-auto sm:w-auto sm:rounded-md sm:border sm:border-rule sm:px-2 sm:py-1 sm:font-mono sm:text-[0.6875rem]"
          >
            <X aria-hidden className="h-5 w-5 sm:hidden" />
            <span aria-hidden className="hidden sm:inline">ESC</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
          {loading ? (
            <p className="px-6 py-8 text-[0.9375rem] text-ink-500" aria-live="polite">
              Opening the archive…
            </p>
          ) : failed ? (
            /* The index did not arrive. /search does the same job on the
               server, so the reader is sent to the thing that still works
               rather than told the search is broken. */
            <p className="px-6 py-8 text-[0.9375rem] text-ink-500">
              Search is not available offline.{' '}
              <Link
                href={query ? `/search?q=${encodeURIComponent(query)}` : '/search'}
                onClick={onClose}
                className="border-b border-gold/50 text-navy hover:text-gold"
              >
                Search the archive
              </Link>{' '}
              when you are back on a signal.
            </p>
          ) : shown.length === 0 ? (
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

        <div className="flex items-center justify-between border-t border-rule bg-ground px-6 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:pb-3.5">
          <span className="text-xs text-ink-subtle">
            {loading ? '' : `${hits.length} ${hits.length === 1 ? 'result' : 'results'}`}
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
