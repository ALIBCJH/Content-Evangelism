'use client'

import * as React from 'react'
import Link from 'next/link'
import { MessageCircleQuestion, Search, Send, X } from 'lucide-react'

/**
 * The way to ask, from anywhere on the site.
 *
 * The question box at the foot of a teaching only helps a reader who has
 * finished it and scrolled past the end. A question does not wait for
 * that — it arrives in the middle of a paragraph, on the archive listing,
 * or on a page that has no box at all. This is the same door, carried on
 * every reader page and reachable at any point in a read.
 *
 * The panel is deliberately a shell for now, and says so: the archive
 * cannot answer in its own voice yet. What it will not do is show a
 * composer that takes a question nowhere — so until the answering is
 * wired, it hands the reader the two routes that do work today, the
 * search over everything published and the desk that answers by hand.
 */
export function AskBot() {
  const [open, setOpen] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  /* Escape closes it, and the focus goes back to the button that opened
     it rather than to the top of the document. */
  React.useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  /* A click anywhere else puts it away. There is no backdrop over the
     page: this sits beside the reading rather than on top of it, and a
     reader who reaches for the text should get the text. */
  React.useEffect(() => {
    if (!open) return
    function onDown(event: MouseEvent) {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          id="ask-bot-panel"
          role="dialog"
          aria-labelledby="ask-bot-title"
          className="fixed bottom-[5.5rem] right-5 z-40 w-[min(21rem,calc(100vw-2.5rem))] animate-fade-in rounded-panel border border-rule bg-card p-5 shadow-glow-soft sm:right-6"
        >
          <span className="kicker text-gold">Ask the archive</span>
          <h2
            id="ask-bot-title"
            className="mt-2 font-article text-[1.1875rem] font-normal leading-[1.3] text-navy"
          >
            A question about a teaching, a prophecy, or a passage
          </h2>
          <p className="mt-2.5 text-[0.9375rem] leading-[1.6] text-ink-muted">
            Answering from what this site has published is still being built. Until
            it is, these two doors are open.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/search"
              onClick={() => setOpen(false)}
              className="focus-ring flex items-center gap-3 rounded-tile border border-rule px-4 py-3 text-[0.9375rem] text-ink transition-colors hover:border-gold/60 hover:text-gold-ink"
            >
              <Search aria-hidden className="h-4 w-4 shrink-0 text-gold" />
              Search everything published
            </Link>
            <Link
              href="/about#ask-a-question"
              onClick={() => setOpen(false)}
              className="focus-ring flex items-center gap-3 rounded-tile border border-rule px-4 py-3 text-[0.9375rem] text-ink transition-colors hover:border-gold/60 hover:text-gold-ink"
            >
              <Send aria-hidden className="h-4 w-4 shrink-0 text-gold" />
              Send your question to the desk
            </Link>
          </div>
        </div>
      )}

      {/* Below the masthead in the stack, so a sticky header passing
          under it stays legible, and below the search overlay, which is
          the one thing that should cover it. */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-controls="ask-bot-panel"
        className="focus-ring fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-plate text-plate-pale shadow-glow-soft transition-all duration-200 hover:bg-plate-deep active:translate-y-px sm:right-6"
      >
        {open ? (
          <X aria-hidden className="h-6 w-6" />
        ) : (
          <MessageCircleQuestion aria-hidden className="h-6 w-6" />
        )}
        <span className="sr-only">{open ? 'Close the question panel' : 'Ask a question'}</span>
      </button>
    </>
  )
}
