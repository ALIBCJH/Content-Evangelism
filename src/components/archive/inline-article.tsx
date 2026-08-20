'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ArticleProse } from '@/components/article-prose'
import { ReadingProgress } from '@/components/progress-bar'
import { useReadInsight } from '@/lib/read-insight'

/**
 * The lead teaching, read where it stands.
 *
 * A reader who has decided to read does not want a page transition first,
 * so the archive stops asking for one: scroll past the card and the
 * teaching carries on underneath it.
 *
 * The body is not in the listing's data and is not put there. The archive
 * ships headlines, standfirsts and references — a body a piece would be
 * sixty kilobytes each, most of it never read — so the text is fetched
 * from the public API at the moment somebody scrolls far enough to want
 * it, and only for the piece they are actually at.
 *
 * That timing also settles the search-engine question. The teaching's own
 * page stays the canonical one; what is fetched here happens in the
 * browser after a scroll, so a crawler indexing the archive is given the
 * listing it was always given, not a second copy of the piece.
 */

type State =
  | { status: 'waiting' }
  | { status: 'loading' }
  | { status: 'ready'; body: string }
  | { status: 'failed' }

export function InlineArticle({
  piece,
}: {
  piece: { slug: string; title: string; href: string; readMinutes: number }
}) {
  const [state, setState] = React.useState<State>({ status: 'waiting' })
  const region = React.useRef<HTMLDivElement>(null)
  const trigger = React.useRef<HTMLDivElement>(null)

  /* A teaching read here is read against its own name, not against the
     front page it happens to be sitting on. */
  useReadInsight(region, piece, state.status === 'ready')

  /* Each lead gets its own fetch; changing the order or the topic changes
     the piece under the card, and the old body must not stay under a new
     headline. */
  React.useEffect(() => {
    setState({ status: 'waiting' })
  }, [piece.slug])

  /* Fetched when the foot of the card comes into view, with a screen of
     warning, so the text is there by the time the reader arrives at it. */
  React.useEffect(() => {
    const mark = trigger.current
    if (!mark || state.status !== 'waiting') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        setState({ status: 'loading' })
        fetch(`/api/v1/articles/${piece.slug}`)
          .then((response) => {
            if (!response.ok) throw new Error(String(response.status))
            return response.json()
          })
          .then((payload) => {
            const body = String(payload?.data?.content?.source ?? '')
            setState(body ? { status: 'ready', body } : { status: 'failed' })
          })
          .catch(() => setState({ status: 'failed' }))
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(mark)
    return () => observer.disconnect()
  }, [piece.slug, state.status])

  return (
    <>
      {/* The gold bar, measuring this teaching rather than the listing it
          sits in — and writing where the reader got to, so an unfinished
          piece is waiting for them in the rail when they come back. */}
      {state.status === 'ready' && <ReadingProgress piece={piece} target={region} />}

      <div ref={trigger} aria-hidden />

      <div ref={region} id="continue" className="scroll-mt-stick">
        {state.status === 'loading' && (
          <div className="mt-10 space-y-4" aria-live="polite">
            <span className="sr-only">Fetching the rest of this teaching…</span>
            {[0, 1, 2, 3].map((line) => (
              <span
                key={line}
                aria-hidden
                className="block h-4 animate-pulse rounded-full bg-surface-2"
                style={{ width: `${[96, 88, 92, 64][line]}%` }}
              />
            ))}
          </div>
        )}

        {state.status === 'failed' && (
          <p className="mt-10 text-[0.9375rem] text-ink-muted">
            The rest of this teaching did not load.{' '}
            <Link href={piece.href} className="border-b border-gold/50 hover:text-gold-ink">
              Open it on its own page
            </Link>
            .
          </p>
        )}

        {state.status === 'ready' && (
          <>
            {/* `opens-large` sets the first letter of the first
                paragraph as a drop cap — the front page reading as a
                page rather than as a card with text under it. */}
            <div className="opens-large mt-10 border-t border-rule pt-10">
              <ArticleProse body={state.body} />
            </div>

            {/* The way to the teaching's own page, kept: it is what a
                reader shares, what a link points at, and where the whole
                apparatus of the piece lives. It is a line at the end
                rather than a button at the start, because by here the
                reader has read it. */}
            <p className="mt-10 border-t border-rule pt-6">
              <Link
                href={piece.href}
                data-track="read-article"
                className="focus-ring group inline-flex items-center gap-2 font-apparatus text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-navy transition-colors hover:text-gold-ink"
              >
                Open this teaching on its own page
                <ArrowRight
                  aria-hidden
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </p>
          </>
        )}
      </div>
    </>
  )
}
