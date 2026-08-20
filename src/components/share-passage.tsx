'use client'

import * as React from 'react'
import { Check, Link2 } from 'lucide-react'

/**
 * A way to send one chapter of a teaching.
 *
 * The share row at the foot sends the whole piece, which is what a reader
 * does when they have finished it. What they do far more often is forward
 * the part that answered a question somebody asked them — and the site
 * gave them no way to do that except to send the top of a twenty-minute
 * page and say "scroll down".
 *
 * Every chapter is already anchored for the contents list, so this is
 * that anchor, offered. The phone's own share sheet where there is one —
 * which on this congregation's phones means WhatsApp — and the clipboard
 * everywhere else.
 */
export function SharePassage({ id, heading }: { id: string; heading: string }) {
  const [copied, setCopied] = React.useState(false)

  const send = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    const shareable = navigator.share !== undefined
    try {
      if (shareable) {
        await navigator.share({ title: heading, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Dismissed the sheet, or denied the clipboard. Either way the
         reader knows what they did and does not need telling. */
    }
  }

  return (
    <button
      type="button"
      onClick={send}
      data-track="share-passage"
      /* Always reachable, never in the way: a hairline mark that comes up
         on hover, on focus, and on any screen without a pointer to hover
         with — where a reader cannot discover it any other way. */
      className="focus-ring inline-flex h-7 w-7 shrink-0 translate-y-[-0.1em] items-center justify-center rounded-full text-ink-subtle opacity-100 transition-all hover:bg-surface-2 hover:text-gold-ink focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
      title={`Share “${heading}”`}
    >
      {copied ? (
        <Check aria-hidden className="h-3.5 w-3.5 text-gold" />
      ) : (
        <Link2 aria-hidden className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">{copied ? 'Link copied' : `Share the passage: ${heading}`}</span>
    </button>
  )
}
