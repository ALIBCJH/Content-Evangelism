'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, Undo2, Trash2, KeyRound } from 'lucide-react'
import { ArticleProse } from '@/components/article-prose'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/**
 * The review desk.
 *
 * The posting desk writes teachings; nothing it writes reaches the site.
 * This page is where somebody senior reads a piece as a reader will get
 * it, and decides. It is deliberately a different page with a different
 * key: the separation is the whole point, and a single page with an
 * "approve" button on it would not be one.
 *
 * A reviewer reads the piece in full here rather than on a preview URL,
 * because a preview URL for unpublished work is a way for unpublished
 * work to get out.
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

const dated = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

export default function ReviewPage() {
  const [key, setKey] = React.useState('')
  const [articles, setArticles] = React.useState<Article[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState<Record<string, string>>({})

  const load = React.useCallback(async (withKey: string) => {
    setError(null)
    try {
      const response = await fetch('/api/articles', {
        headers: withKey ? { Authorization: `Bearer ${withKey}` } : {},
        cache: 'no-store',
      })
      const body = await response.json()
      if (!response.ok) {
        setError(body.error ?? `The desk returned ${response.status}.`)
        return
      }
      setArticles(body.articles as Article[])
    } catch {
      setError('Could not reach the desk.')
    }
  }, [])

  React.useEffect(() => {
    void load('')
  }, [load])

  const waiting = (articles ?? []).filter((article) => article.status === 'pending')
  const live = (articles ?? []).filter((article) => article.status !== 'pending')

  const decide = async (
    slug: string,
    action: 'approve' | 'send-back' | 'unpublish',
    note?: string
  ) => {
    if (!key) {
      setError('Enter the review key first.')
      return
    }
    setBusy(slug)
    setError(null)
    try {
      const response = await fetch(`/api/review/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ action, note }),
      })
      const body = await response.json()
      if (!response.ok) setError(body.error ?? 'That did not go through.')
      else {
        setOpen(null)
        await load(key)
      }
    } catch {
      setError('Could not reach the desk.')
    }
    setBusy(null)
  }

  const remove = async (slug: string) => {
    if (!key) {
      setError('Enter the review key first.')
      return
    }
    if (!window.confirm('Remove this piece permanently? The writing is not recoverable.')) return
    setBusy(slug)
    try {
      const response = await fetch(`/api/articles/${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${key}` },
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        setError(body.error ?? 'That did not go through.')
      } else await load(key)
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

      <h1 className="font-display text-3xl font-semibold text-ink-strong md:text-4xl">
        What is waiting to go on the site
      </h1>
      <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-ink-muted">
        Nothing written at the posting desk reaches a reader until it is approved here. Approving
        puts the teaching on the site and marks it as checked against the ministry&apos;s own
        teaching.
      </p>

      <div className="mt-6 max-w-md">
        <label htmlFor="review-key" className={label}>
          Review key
        </label>
        <div className="relative mt-2">
          <KeyRound
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
          />
          <Input
            id="review-key"
            type="password"
            value={key}
            onChange={(event) => {
              setKey(event.target.value)
              void load(event.target.value)
            }}
            placeholder="Needed to approve, send back or remove"
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 font-sans text-sm text-status-danger">
          {error}
        </p>
      )}

      {/* ── The queue ───────────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-baseline gap-3 font-display text-xl text-ink-strong">
          Waiting for review
          <span className="tabular font-sans text-sm text-ink-subtle">{waiting.length}</span>
        </h2>

        {waiting.length === 0 ? (
          <p className="rounded-2xl border border-hairline bg-surface px-5 py-6 font-sans text-sm text-ink-muted">
            {key
              ? 'Nothing is waiting. Everything written has been dealt with.'
              : 'Enter the review key to see what is waiting.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {waiting.map((article) => (
              <li key={article.slug} className="rounded-2xl border border-hairline bg-surface">
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

      {/* ── What is already out ─────────────────────────────────────── */}
      {key && live.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 flex items-baseline gap-3 font-display text-xl text-ink-strong">
            On the site
            <span className="tabular font-sans text-sm text-ink-subtle">{live.length}</span>
          </h2>
          <ul className="divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
            {live.map((article) => (
              <li key={article.slug} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <Link
                  href={`/articles/${article.slug}`}
                  className="min-w-0 flex-1 font-sans text-sm text-ink-strong hover:text-gold"
                >
                  {article.title}
                </Link>
                <span className="font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
                  {article.verified ? 'Verified' : 'Not verified'}
                </span>
                {/* Taking a teaching down is not a small thing: its address
                    is out there and will stop answering. */}
                <button
                  type="button"
                  onClick={() => decide(article.slug, 'unpublish')}
                  disabled={busy === article.slug}
                  className="focus-ring font-sans text-xs font-bold uppercase tracking-kicker text-ink-subtle transition-colors hover:text-status-danger"
                >
                  Unpublish
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-sans text-xs text-ink-subtle">
            Unpublishing takes a teaching off the site and returns it to the queue. Its address stops
            answering for anybody holding the link.
          </p>
        </section>
      )}
    </main>
  )
}
