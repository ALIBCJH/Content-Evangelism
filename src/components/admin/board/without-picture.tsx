'use client'

import * as React from 'react'
import Link from 'next/link'
import { ExternalLink, ImageOff, Loader2, Undo2 } from 'lucide-react'
import type { PieceRow } from '@/lib/desk-overview'
import { dated } from './format'

/**
 * The teachings on the site with no picture of their own.
 *
 * The site draws a generated field for these — a coloured band belonging
 * to the section rather than to the teaching — so every piece in
 * Teachings wears the same one and a reader scanning the front page is
 * given nothing to tell one from the next. It reads as a site that has
 * not been finished, which is the opposite of what the artwork is for.
 *
 * The rule the ministry has settled on is that a teaching waits until it
 * has a picture. `reviewArticle` keeps that at the only door onto the
 * site — approving a pictureless teaching is refused — and this band is
 * the other half: the ones that went on the site before there was a rule,
 * and the way to take them off.
 *
 * It is deliberately not a quiet filter on the reader's side. A desk that
 * said "published" about a teaching no reader could reach would be
 * holding two answers to one question, and nobody at the desk would know
 * which was true. Taking one down changes its status, which is the same
 * fact everywhere.
 *
 * The band disappears when the list is empty. A heading reading "None" is
 * a job advertised to somebody who has already finished it.
 */
export function WithoutPictureBand({
  rows,
  busy,
  onTakeDown,
  onTakeDownAll,
}: {
  rows: PieceRow[]
  /** The slug currently being written, so its row can say so. */
  busy: string | null
  onTakeDown: (slug: string) => void | Promise<void>
  onTakeDownAll: (slugs: string[]) => void | Promise<void>
}) {
  if (rows.length === 0) return null

  /* Named, and counted, because "take them all down" is a decision about
     eleven addresses that are out there and will stop answering. A
     confirmation that does not say how many is one somebody agrees to
     without reading. */
  const takeAllDown = async () => {
    const titles = rows.map((row) => `· ${row.title}`).join('\n')
    if (
      !window.confirm(
        `Take ${rows.length} ${rows.length === 1 ? 'teaching' : 'teachings'} off the site?\n\n${titles}\n\nEach returns to the queue and its address stops answering until it has a picture and is approved again. The writing is not touched.`
      )
    ) {
      return
    }
    await onTakeDownAll(rows.map((row) => row.slug))
  }

  return (
    <section aria-labelledby="band-no-picture">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="band-no-picture" className="font-display text-xl text-ink-strong">
            On the site without a picture
            <span className="tabular ml-3 font-sans text-sm text-ink-subtle">{rows.length}</span>
          </h2>
          <p className="mt-2 max-w-prose font-sans text-sm leading-relaxed text-ink-muted">
            These are drawn with a generated field belonging to their section, so every teaching in
            a section looks the same in a listing. Give one a picture at the posting desk, or take
            it off the site until it has one. A teaching with no picture can no longer be approved.
          </p>
        </div>

        <button
          type="button"
          onClick={takeAllDown}
          disabled={busy !== null}
          className="focus-ring inline-flex items-center gap-1.5 rounded-chip border border-gold/50 px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-kicker text-gold transition-colors hover:bg-gold/10 disabled:opacity-40"
        >
          {busy !== null ? (
            <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Undo2 aria-hidden className="h-3.5 w-3.5" />
          )}
          Take all {rows.length} off the site
        </button>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.slug}
            className="desk-card flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3"
          >
            <div className="min-w-[14rem] flex-1">
              <span className="flex items-center gap-2 font-sans text-sm font-semibold text-ink-strong">
                <ImageOff aria-hidden className="h-4 w-4 shrink-0 text-ink-subtle" />
                {row.title}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-xs text-ink-subtle">
                <span>{row.category}</span>
                <span className="tabular">{dated(row.publishedAt)}</span>
                <Link
                  href={`/articles/${row.slug}`}
                  className="inline-flex items-center gap-1 transition-colors hover:text-gold"
                >
                  On the site
                  <ExternalLink aria-hidden className="h-3 w-3" />
                </Link>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin?edit=${row.slug}`}
                className="focus-ring rounded-chip border border-hairline px-3.5 py-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:border-gold/60 hover:text-gold"
              >
                Give it a picture
              </Link>
              <button
                type="button"
                onClick={() => onTakeDown(row.slug)}
                disabled={busy !== null}
                className="focus-ring inline-flex items-center gap-1.5 rounded-chip border border-hairline px-3.5 py-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-40"
              >
                {busy === row.slug ? (
                  <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Undo2 aria-hidden className="h-3.5 w-3.5" />
                )}
                Take it off
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
