'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, Undo2, Trash2, RefreshCw } from 'lucide-react'
import { ArticleProse } from '@/components/article-prose'
import { Button } from '@/components/ui/button'
import type { DayTotals } from '@/lib/insight-shape'
import { withoutPicture, type DeskNeeds, type PartRow, type PieceRow, type WindowSummary } from '@/lib/desk-overview'
import { FindingsBand } from '@/components/admin/board/findings'
import { HealthBand, NeedsBand, PartsBand, StretchBand } from '@/components/admin/board/bands'
import { PiecesTable } from '@/components/admin/board/pieces-table'
import { WritersBand } from '@/components/admin/board/writers-band'
import { WithoutPictureBand } from '@/components/admin/board/without-picture'
import { dated as boardDated } from '@/components/admin/board/format'

/**
 * The review desk.
 *
 * The posting desk writes teachings; nothing it writes reaches the site.
 * This page is where somebody senior reads a piece as a reader will get
 * it, and decides. It is deliberately a different page with a different
 * key: the separation is the whole point, and a single page with an
 * "approve" button on it would not be one. The key is presented at the
 * door now rather than on this page — a session that reaches here is one
 * the middleware has already established may approve.
 *
 * A reviewer reads the piece in full here rather than on a preview URL,
 * because a preview URL for unpublished work is a way for unpublished
 * work to get out.
 *
 * It is also the board. What the desk has to decide, what readers did
 * with what it published, and whether the machinery underneath is sound
 * were three things on three pages, and the effect was that nobody looked
 * at any of them: the counters sat behind a key on a page you had to know
 * existed, and the fact that most of what is on the site was never
 * checked against the ministry's own teaching was a grey word at the end
 * of a row. They are one page now, in the order somebody actually needs
 * them — the decisions first, the measurements under them.
 *
 * Everything measured is arithmetic done in `desk-overview.ts` and handed
 * over by `/api/desk/overview`; this file draws it and owns the actions.
 */

interface Article {
  slug: string
  title: string
  dek: string
  category: string
  authorName: string
  body: string
  publishedAt: string
  submittedAt?: string
  status?: 'pending' | 'published'
  verified?: boolean
  review?: { note: string; at: string }
  tags?: string[]
  readMinutes: number
}

/** Everything /api/desk/overview answers with. */
interface Board {
  days: number
  needs: DeskNeeds
  summary: WindowSummary
  series: DayTotals[]
  pieces: PieceRow[]
  deadEnds: PieceRow[]
  unread: PieceRow[]
  parts: PartRow[]
  clicks: { label: string; count: number }[]
  healthNotes: { level: 'bad' | 'warn' | 'good'; note: string }[]
}

/**
 * The stretches worth asking for.
 *
 * A week is what changed since the last time somebody looked, a month is
 * the working answer, and three months is as far back as the day-by-day
 * counters are kept — see DAYS_KEPT.
 */
const WINDOWS = [7, 30, 90]

/**
 * The board's own, which keeps the desk to one rule — recency for the
 * first day, then a date. Absent stays blank here rather than the board's
 * em-dash: these read as "Sent back {date}" in a sentence, and a dash
 * mid-sentence is worse than nothing.
 */
const dated = (iso?: string) => (iso ? boardDated(iso) : '')

export default function ReviewPage() {
  const [articles, setArticles] = React.useState<Article[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState<Record<string, string>>({})
  const [board, setBoard] = React.useState<Board | null>(null)
  const [days, setDays] = React.useState<number>(30)
  const [loading, setLoading] = React.useState(true)

  /**
   * The queue and the board, together.
   *
   * Two answers rather than one because the queue holds every teaching's
   * full body — a reviewer reads it here — and the board holds none of
   * it. Asked for at the same moment so the page arrives whole rather
   * than settling into place a band at a time.
   */
  const load = React.useCallback(async (over: number) => {
    setError(null)
    setLoading(true)
    try {
      /* No Authorization header: the session cookie is attached by the
         browser and resolved to this reviewer's key on the server. */
      const [queue, overview] = await Promise.all([
        fetch('/api/articles', { cache: 'no-store' }),
        fetch(`/api/desk/overview?days=${over}`, { cache: 'no-store' }),
      ])

      const queueBody = await queue.json().catch(() => ({}))
      if (!queue.ok) setError(queueBody.error ?? `The desk returned ${queue.status}.`)
      else setArticles(queueBody.articles as Article[])

      const boardBody = await overview.json().catch(() => ({}))
      if (overview.ok) setBoard(boardBody as Board)
      /* The queue is the part that must work. A board that failed to
         arrive is worth saying once and not worth blocking the desk. */
      else if (queue.ok) setError(boardBody.error ?? 'The numbers could not be read.')
    } catch {
      setError('Could not reach the desk.')
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void load(days)
  }, [load, days])

  /* Only the queue is read off the full articles: it is the one part of
     the page that needs each teaching's body. Everything already on the
     site is drawn from the board, which carries the counters with it. */
  const waiting = (articles ?? []).filter((article) => article.status === 'pending')

  /**
   * One verdict, sent. No reload of its own, so a run of them is a run of
   * decisions rather than a run of decisions each followed by the whole
   * board being fetched again.
   */
  const send = async (
    slug: string,
    action: 'approve' | 'send-back' | 'unpublish' | 'verify',
    note?: string
  ): Promise<boolean> => {
    setBusy(slug)
    try {
      const response = await fetch(`/api/review/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(body.error ?? 'That did not go through.')
        return false
      }
      return true
    } catch {
      setError('Could not reach the desk.')
      return false
    }
  }

  const decide = async (
    slug: string,
    action: 'approve' | 'send-back' | 'unpublish' | 'verify',
    note?: string
  ) => {
    setError(null)
    if (await send(slug, action, note)) {
      setOpen(null)
      await load(days)
    }
    setBusy(null)
  }

  /**
   * Every pictureless teaching off the site, in one press.
   *
   * One at a time rather than all at once, and that is not politeness.
   * The whole archive is a single document that every write reads,
   * changes and puts back — see `writeStore` — so eleven of these fired
   * together against Upstash race each other and ten of the eleven
   * changes can be lost. Sequential is the only correct order.
   *
   * It stops at the first refusal. A run that carried on would leave the
   * desk with one error message standing for an unknown number of
   * failures, and no way to tell which teachings actually came down.
   */
  const takeDownAll = async (slugs: string[]) => {
    setError(null)
    for (const slug of slugs) {
      if (!(await send(slug, 'unpublish'))) break
    }
    setBusy(null)
    await load(days)
  }

  const remove = async (slug: string) => {
    /* Named rather than "this piece": the table runs to dozens of rows and
       an unnamed confirmation is one somebody agrees to without reading. */
    const title = (articles ?? []).find((held) => held.slug === slug)?.title ?? slug
    if (
      !window.confirm(
        `Delete "${title}" for good?\n\nThe writing is not recoverable, and if it is on the site its address stops answering.`
      )
    ) {
      return
    }
    setBusy(slug)
    try {
      const response = await fetch(`/api/articles/${slug}`, { method: 'DELETE' })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        setError(body.error ?? 'That did not go through.')
      } else await load(days)
    } catch {
      setError('Could not reach the desk.')
    }
    setBusy(null)
  }

  const label = 'font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted'

  return (
    <main className="shell max-w-[64rem] pb-24 pt-10">
      <p className="kicker mb-4 text-ink-subtle">
        <Link href="/admin" className="hover:text-gold">
          The desk
        </Link>{' '}
        · Review
      </p>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-strong md:text-4xl">
            The review desk
          </h1>
          <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-ink-muted">
            Nothing written at the posting desk reaches a reader until it is approved here.
            Approving puts the teaching on the site and marks it as checked against the
            ministry&apos;s own teaching.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-hairline p-1">
          {WINDOWS.map((window) => (
            <button
              key={window}
              type="button"
              onClick={() => setDays(window)}
              aria-pressed={days === window}
              className={`focus-ring rounded-full px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-kicker transition-colors ${
                days === window ? 'bg-gold/15 text-gold' : 'text-ink-subtle hover:text-ink-muted'
              }`}
            >
              {window} days
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load(days)}
            disabled={loading}
            aria-label="Read the numbers again"
            className="focus-ring rounded-full px-2.5 py-1.5 text-ink-subtle transition-colors hover:text-gold disabled:opacity-40"
          >
            <RefreshCw aria-hidden className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 font-sans text-sm text-status-danger">
          {error}
        </p>
      )}

      {board && (
        <div className="mt-10">
          <NeedsBand needs={board.needs} />
        </div>
      )}

      {/* ── The queue ───────────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-baseline gap-3 font-display text-xl text-ink-strong">
          Waiting for review
          <span className="tabular font-sans text-sm text-ink-subtle">{waiting.length}</span>
        </h2>

        {waiting.length === 0 ? (
          <p className="desk-card px-5 py-6 font-sans text-sm text-ink-muted">
            Nothing is waiting. Everything written has been dealt with.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {waiting.map((article) => (
              <li key={article.slug} className="desk-card">
                <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
                      {article.category} · {article.authorName} ·{' '}
                      <span className="tabular">{article.readMinutes}</span> min ·{' '}
                      {dated(article.submittedAt ?? article.publishedAt)}
                    </p>
                    <h3 className="mt-1.5 font-display text-lg font-semibold text-ink-strong">
                      {article.title}
                    </h3>
                    <p className="mt-1 max-w-prose font-sans text-sm text-ink-muted">{article.dek}</p>
                    {article.review && (
                      <p className="mt-3 rounded-lg border border-gold/40 bg-chip-gold/40 px-3 py-2 font-sans text-xs text-ink-strong">
                        Sent back {dated(article.review.at)}: {article.review.note}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(open === article.slug ? null : article.slug)}
                    className="focus-ring shrink-0 rounded-chip border border-hairline px-3.5 py-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:border-gold/60 hover:text-gold"
                  >
                    {open === article.slug ? 'Close' : 'Read it'}
                  </button>
                </div>

                {open === article.slug && (
                  <div className="border-t border-hairline px-5 py-5">
                    {/* Read here rather than on a preview URL: an address
                        that serves unpublished work is a way for
                        unpublished work to get out. */}
                    <div className="max-h-[32rem] overflow-y-auto rounded-xl bg-card px-5 py-4">
                      <ArticleProse body={article.body} />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        disabled={busy === article.slug}
                        onClick={() => decide(article.slug, 'approve')}
                        className="gap-2"
                      >
                        {busy === article.slug ? (
                          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 aria-hidden className="h-4 w-4" />
                        )}
                        Approve and publish
                      </Button>
                      <Link
                        href={`/admin?edit=${article.slug}`}
                        className="focus-ring rounded-chip border border-hairline px-4 py-2.5 font-sans text-sm text-ink-muted transition-colors hover:border-gold/60 hover:text-gold"
                      >
                        Edit first
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(article.slug)}
                        disabled={busy === article.slug}
                        className="focus-ring ml-auto inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-kicker text-ink-subtle transition-colors hover:text-status-danger"
                      >
                        <Trash2 aria-hidden className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="mt-5 border-t border-hairline pt-4">
                      <label htmlFor={`note-${article.slug}`} className={label}>
                        Or send it back, with a reason
                      </label>
                      <textarea
                        id={`note-${article.slug}`}
                        rows={2}
                        value={notes[article.slug] ?? ''}
                        onChange={(event) =>
                          setNotes((held) => ({ ...held, [article.slug]: event.target.value }))
                        }
                        placeholder="What needs changing before this goes on the site."
                        className="focus-ring mt-2 w-full rounded-2xl border border-hairline bg-card px-4 py-3 font-sans text-sm text-ink-strong placeholder:text-ink-subtle"
                      />
                      <button
                        type="button"
                        disabled={busy === article.slug || (notes[article.slug] ?? '').trim().length < 3}
                        onClick={() => decide(article.slug, 'send-back', notes[article.slug])}
                        className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded-chip border border-hairline px-4 py-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-40"
                      >
                        <Undo2 aria-hidden className="h-3.5 w-3.5" />
                        Send back to the writer
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── The measurements ────────────────────────────────────────── */}
      {board && (
        <div className="mt-14 flex flex-col gap-14">
          <StretchBand summary={board.summary} series={board.series} days={board.days} />

          {/* Above the table, because it is a decision rather than a
              measurement, and below the numbers only because the queue
              at the top of this page is the more urgent one. */}
          <WithoutPictureBand
            rows={withoutPicture(board.pieces)}
            busy={busy}
            onTakeDown={(slug) => decide(slug, 'unpublish')}
            onTakeDownAll={takeDownAll}
          />

          <PiecesTable
            rows={board.pieces}
            days={board.days}
            renderActions={(row) => (
              <>
                <Link
                  href={`/admin?edit=${row.slug}`}
                  className="focus-ring rounded-chip border border-hairline px-3.5 py-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:border-gold/60 hover:text-gold"
                >
                  Edit at the posting desk
                </Link>

                {row.status !== 'pending' && !row.verified && (
                  <>
                    {/* For the teachings that were on the site before
                        there was a review desk to put them there. They
                        cannot be approved — approving is the door onto the
                        site, and they are already through it — so this is
                        the only way somebody can say they have now read
                        one against the ministry's own teaching. */}
                    <button
                      type="button"
                      onClick={() => decide(row.slug, 'verify')}
                      disabled={busy === row.slug}
                      className="focus-ring inline-flex items-center gap-1.5 rounded-chip border border-status-success/40 px-3.5 py-2 font-sans text-xs font-bold uppercase tracking-kicker text-status-success transition-colors hover:bg-status-success/10 disabled:opacity-40"
                    >
                      {busy === row.slug ? (
                        <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
                      )}
                      I have checked this
                    </button>
                    <span className="font-sans text-xs text-ink-subtle">
                      Marks it checked against the ministry&apos;s own teaching. The teaching itself
                      is not touched, and its date does not change.
                    </span>
                  </>
                )}

                {row.status !== 'pending' && (
                  <>
                    {/* Taking a teaching down is not a small thing: its
                        address is out there and will stop answering. */}
                    <button
                      type="button"
                      onClick={() => decide(row.slug, 'unpublish')}
                      disabled={busy === row.slug}
                      className="focus-ring inline-flex items-center gap-1.5 rounded-chip border border-hairline px-3.5 py-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-40"
                    >
                      <Undo2 aria-hidden className="h-3.5 w-3.5" />
                      Unpublish
                    </button>
                    <span className="font-sans text-xs text-ink-subtle">
                      Unpublishing returns it to the queue; its address stops answering.
                    </span>
                  </>
                )}

                {/* Deleting was on the posting desk, next to Edit, on every
                    published teaching — so the one irreversible act at this
                    ministry sat under the hand of whoever was writing, one
                    button away from the one they meant. It is here now,
                    behind the review key, folded inside a row somebody has
                    deliberately opened. */}
                <button
                  type="button"
                  onClick={() => remove(row.slug)}
                  disabled={busy === row.slug}
                  className="focus-ring ml-auto inline-flex items-center gap-1.5 rounded-chip px-3.5 py-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink-subtle transition-colors hover:text-status-danger disabled:opacity-40"
                >
                  <Trash2 aria-hidden className="h-3.5 w-3.5" />
                  Delete for good
                </button>
              </>
            )}
          />

          <WritersBand />

          <FindingsBand deadEnds={board.deadEnds} unread={board.unread} />

          <PartsBand parts={board.parts} clicks={board.clicks} />

          <HealthBand notes={board.healthNotes} />
        </div>
      )}
    </main>
  )
}
