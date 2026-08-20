'use client'

import * as React from 'react'
import Link from 'next/link'
import { CLICK_LABELS, type ClickLabel, type PageInsight } from '@/lib/insight-shape'

/**
 * What the counters say, for the desk.
 *
 * Behind the posting key, like everything else under /admin — not because
 * the numbers are sensitive but because they are the ministry's, and a
 * public dashboard is one more thing to keep honest.
 *
 * The columns are chosen to answer the question that prompted this: which
 * teachings hold a reader. Views alone answer the wrong one — a piece
 * everybody opens and nobody finishes is a headline that worked and a
 * teaching that did not, and the two are only distinguishable with the
 * time and the finish rate beside each other.
 */

const minutes = (s: number) =>
  s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`

export default function InsightPage() {
  const [key, setKey] = React.useState('')
  const [pages, setPages] = React.useState<PageInsight[] | null>(null)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const load = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/insight', {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? `The desk returned ${response.status}.`)
        setPages(null)
      } else {
        const body = (await response.json()) as { pages: PageInsight[] }
        setPages(body.pages)
      }
    } catch {
      setError('Could not reach the desk.')
    }
    setLoading(false)
  }

  const totals = (pages ?? []).reduce(
    (sum, p) => ({
      views: sum.views + p.views,
      seconds: sum.seconds + p.seconds,
      finished: sum.finished + p.finished,
    }),
    { views: 0, seconds: 0, finished: 0 }
  )

  /* The question the desk actually asks is not how many pages were
     opened but how many teachings were read — and since the archive
     reads a teaching in place, a reading is counted against the teaching
     wherever it happened rather than against the page it sat on. These
     are those readings, and the share of them that reached the end. */
  const teachings = (pages ?? [])
    .filter((p) => p.path.startsWith('/articles/'))
    .reduce(
      (sum, p) => ({
        reads: sum.reads + p.views,
        seconds: sum.seconds + p.seconds,
        finished: sum.finished + p.finished,
      }),
      { reads: 0, seconds: 0, finished: 0 }
    )
  const throughToTheEnd = teachings.reads
    ? Math.round((teachings.finished / teachings.reads) * 100)
    : 0
  const usedLabels = CLICK_LABELS.filter((label) =>
    (pages ?? []).some((p) => (p.clicks[label] ?? 0) > 0)
  )

  return (
    <main className="shell pb-24 pt-10">
      <p className="kicker mb-4 text-ink-subtle">
        <Link href="/admin" className="hover:text-gold">
          The desk
        </Link>{' '}
        · Insight
      </p>
      <h1 className="mb-3 font-display text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-navy sm:text-[3rem]">
        How the site is read
      </h1>
      <p className="mb-9 max-w-[640px] text-[0.9375rem] leading-[1.7] text-ink-700">
        Counters only. No cookie is set, no identifier is issued and nothing is
        stored about any reader — so there are no visitors here, only visits.
        Readers who ask not to be counted, through Do Not Track or Global
        Privacy Control, are not counted.
      </p>

      <form onSubmit={load} className="mb-10 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="kicker mb-2 block text-ink-subtle">Posting key</span>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="focus-ring w-[260px] rounded-tile border border-rule bg-card px-4 py-3 text-[0.9375rem]"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !key}
          className="focus-ring rounded-tile bg-plate px-6 py-3 text-[0.9375rem] font-semibold text-plate-pale disabled:opacity-50"
        >
          {loading ? 'Reading…' : 'Show the numbers'}
        </button>
      </form>

      {error && (
        <p className="mb-8 rounded-tile border border-dashed border-source-rule bg-source-bg px-5 py-4 text-[0.9375rem] text-source-ink">
          {error}
        </p>
      )}

      {pages && pages.length === 0 && (
        <p className="text-[0.9375rem] text-ink-muted">
          Nothing counted yet. The first reader will open this.
        </p>
      )}

      {pages && pages.length > 0 && (
        <>
          <dl className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Teachings read', teachings.reads.toLocaleString(), 'A teaching opened, wherever it was read'],
              ['Read to the end', `${throughToTheEnd}%`, `${teachings.finished.toLocaleString()} of ${teachings.reads.toLocaleString()}`],
              ['Time spent reading', minutes(teachings.seconds), 'Engaged time in the teachings themselves'],
              ['Pages opened', totals.views.toLocaleString(), 'Every page on the site, the archive included'],
            ].map(([k, v, note]) => (
              <div key={k} className="rounded-panel border border-rule bg-card px-6 py-5">
                <dt className="kicker mb-2 text-ink-subtle">{k}</dt>
                <dd className="font-display text-[1.75rem] text-navy">{v}</dd>
                <dd className="mt-1.5 text-[0.75rem] leading-[1.5] text-ink-subtle">{note}</dd>
              </div>
            ))}
          </dl>

          <div className="overflow-x-auto rounded-panel border border-rule bg-card">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <thead>
                <tr>
                  {['Page', 'Visits', 'Avg. time', 'Finished', ...usedLabels].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="border-b border-rule bg-raised px-4 py-3 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-subtle"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.path}>
                    <th scope="row" className="border-b border-rule-soft px-4 py-3 text-left">
                      <Link href={page.path} className="text-[0.875rem] text-navy hover:text-gold">
                        {page.path}
                      </Link>
                    </th>
                    <td className="tabular border-b border-rule-soft px-4 py-3 font-mono text-[0.8125rem] text-ink-900">
                      {page.views}
                    </td>
                    <td className="tabular border-b border-rule-soft px-4 py-3 font-mono text-[0.8125rem] text-ink-900">
                      {minutes(page.views ? Math.round(page.seconds / page.views) : 0)}
                    </td>
                    <td className="tabular border-b border-rule-soft px-4 py-3 font-mono text-[0.8125rem] text-ink-900">
                      {page.views ? `${Math.round((page.finished / page.views) * 100)}%` : '—'}
                    </td>
                    {usedLabels.map((label) => (
                      <td
                        key={label}
                        className="tabular border-b border-rule-soft px-4 py-3 font-mono text-[0.8125rem] text-ink-muted"
                      >
                        {page.clicks[label as ClickLabel] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}
