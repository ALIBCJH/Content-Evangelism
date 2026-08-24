'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import type { PieceRow } from '@/lib/desk-overview'
import { ENOUGH_TO_JUDGE } from '@/lib/desk-overview'
import { count, dated, duration, headingWords, percent } from './format'

/**
 * Every piece, one row, with what readers did with it.
 *
 * The list and the numbers used to be two pages, which meant deciding
 * whether a teaching was working involved holding one screen in your head
 * while looking at another. They are the same question and belong on the
 * same line.
 *
 * A row opens to show where inside the teaching the time went — the
 * per-heading seconds the tracker has always recorded and nothing has
 * ever shown. A teaching that holds readers through two sections and
 * loses them in the third is telling the desk something no page total
 * can.
 */

type SortKey = 'attention' | 'views' | 'finish' | 'published' | 'title'

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'right'; hint: string }[] = [
  { key: 'title', label: 'Teaching', align: 'left', hint: 'By title' },
  { key: 'views', label: 'Visits', align: 'right', hint: 'Visits in this stretch' },
  { key: 'finish', label: 'Finished', align: 'right', hint: 'Share of visits that reached the end' },
  { key: 'attention', label: 'Time', align: 'right', hint: 'Total engaged time' },
  { key: 'published', label: 'Published', align: 'right', hint: 'By date' },
]

function sorted(rows: PieceRow[], key: SortKey, ascending: boolean): PieceRow[] {
  const order = ascending ? 1 : -1
  const copy = [...rows]
  copy.sort((a, b) => {
    switch (key) {
      case 'title':
        return a.title.localeCompare(b.title) * order
      case 'views':
        return (a.views - b.views) * order
      case 'finish':
        /* A rate off three visits is not a rate. Pieces without enough
           readings to judge sink to the bottom whichever way the column
           is pointed, rather than topping the table at a confident 100%. */
        if (a.views < ENOUGH_TO_JUDGE || b.views < ENOUGH_TO_JUDGE) {
          return (a.views < ENOUGH_TO_JUDGE ? 1 : 0) - (b.views < ENOUGH_TO_JUDGE ? 1 : 0)
        }
        return (a.finishRate - b.finishRate) * order
      case 'published':
        return a.publishedAt.localeCompare(b.publishedAt) * order
      default:
        return (a.seconds - b.seconds) * order
    }
  })
  return copy
}

function Status({ row }: { row: PieceRow }) {
  if (row.status === 'pending') {
    return (
      <span className="rounded-chip bg-gold/15 px-2 py-0.5 font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-gold">
        {row.review ? 'Sent back' : 'Waiting'}
      </span>
    )
  }
  return row.verified ? (
    <span className="font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-status-success">
      Verified
    </span>
  ) : (
    <span className="font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-status-warning">
      Unverified
    </span>
  )
}

export function PiecesTable({
  rows,
  days,
  renderActions,
}: {
  rows: PieceRow[]
  days: number
  /**
   * What may be done to a piece, supplied by the desk rather than known
   * here. The table stays a way of looking at the writing; the page keeps
   * the decisions, and the network calls that go with them.
   */
  renderActions?: (row: PieceRow) => React.ReactNode
}) {
  const [key, setKey] = React.useState<SortKey>('attention')
  const [ascending, setAscending] = React.useState(false)
  const [open, setOpen] = React.useState<string | null>(null)

  const shown = React.useMemo(() => sorted(rows, key, ascending), [rows, key, ascending])

  const head = (column: (typeof COLUMNS)[number]) => {
    const active = key === column.key
    return (
      <th
        key={column.key}
        scope="col"
        className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
        aria-sort={active ? (ascending ? 'ascending' : 'descending') : 'none'}
      >
        <button
          type="button"
          title={column.hint}
          onClick={() => {
            if (active) setAscending((was) => !was)
            else {
              setKey(column.key)
              /* Titles read naturally A–Z; every number is more useful
                 largest-first. */
              setAscending(column.key === 'title')
            }
          }}
          className={`focus-ring inline-flex items-center gap-1 rounded-chip px-1 font-sans text-[0.6875rem] font-bold uppercase tracking-kicker transition-colors ${
            active ? 'text-gold' : 'text-ink-subtle hover:text-ink-muted'
          }`}
        >
          {column.label}
          {active &&
            (ascending ? (
              <ChevronUp aria-hidden className="h-3 w-3" />
            ) : (
              <ChevronDown aria-hidden className="h-3 w-3" />
            ))}
        </button>
      </th>
    )
  }

  return (
    <section aria-labelledby="band-pieces">
      <h2 id="band-pieces" className="font-display text-xl text-ink-strong">
        Everything written
        <span className="tabular ml-3 font-sans text-sm text-ink-subtle">{rows.length}</span>
      </h2>
      <p className="mt-2 max-w-prose font-sans text-sm leading-relaxed text-ink-muted">
        Visits and time are for the last {days} days. Open a row to see where inside the teaching
        the time was spent.
      </p>

      {/* The table scrolls inside its own box rather than pushing the page
          sideways — at 390px five columns do not fit and never will. */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-hairline bg-surface">
        <table className="w-full min-w-[46rem] border-collapse">
          <thead>
            <tr className="border-b border-hairline">{COLUMNS.map(head)}</tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-8 text-center font-sans text-sm text-ink-muted"
                >
                  Nothing written yet.
                </td>
              </tr>
            )}

            {shown.map((row) => {
              const expanded = open === row.slug
              const judged = row.views >= ENOUGH_TO_JUDGE
              return (
                <React.Fragment key={row.slug}>
                  <tr className="border-b border-hairline/60 last:border-0">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setOpen(expanded ? null : row.slug)}
                        aria-expanded={expanded}
                        className="focus-ring rounded-chip text-left font-sans text-sm font-semibold text-ink-strong transition-colors hover:text-gold"
                      >
                        {row.title}
                      </button>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-xs text-ink-subtle">
                        <Status row={row} />
                        <span>{row.category}</span>
                        <span>{row.authorName}</span>
                        <span className="tabular">{row.readMinutes} min</span>
                        {row.status !== 'pending' && (
                          <Link
                            href={`/articles/${row.slug}`}
                            className="inline-flex items-center gap-1 transition-colors hover:text-gold"
                          >
                            On the site
                            <ExternalLink aria-hidden className="h-3 w-3" />
                          </Link>
                        )}
                      </span>
                    </td>
                    <td className="tabular px-4 py-3 text-right font-sans text-sm text-ink-strong">
                      {count(row.views)}
                      {row.viewsEver !== row.views && (
                        <span className="block font-sans text-xs text-ink-subtle">
                          {count(row.viewsEver)} ever
                        </span>
                      )}
                    </td>
                    <td className="tabular px-4 py-3 text-right font-sans text-sm">
                      {judged ? (
                        <span className={row.finishRate < 0.25 ? 'text-status-danger' : 'text-ink-strong'}>
                          {percent(row.finishRate)}
                        </span>
                      ) : (
                        <span className="text-ink-subtle" title="Too few visits to judge">
                          —
                        </span>
                      )}
                    </td>
                    <td className="tabular px-4 py-3 text-right font-sans text-sm text-ink-strong">
                      {duration(row.seconds)}
                      {row.views > 0 && (
                        <span className="block font-sans text-xs text-ink-subtle">
                          {duration(row.averageSeconds)} each
                        </span>
                      )}
                    </td>
                    <td className="tabular px-4 py-3 text-right font-sans text-sm text-ink-muted">
                      {dated(row.publishedAt)}
                    </td>
                  </tr>

                  {expanded && (
                    <tr className="border-b border-hairline/60 bg-hairline/20">
                      <td colSpan={COLUMNS.length} className="px-4 py-4">
                        <SectionBreakdown row={row} actions={renderActions?.(row)} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/**
 * Where inside one teaching the time went.
 *
 * All-time rather than windowed: a piece may have had its readers months
 * ago, and the shape of how it was read does not go stale the way a
 * visit count does.
 */
function SectionBreakdown({ row, actions }: { row: PieceRow; actions?: React.ReactNode }) {
  return (
    <div>
      {row.sections.length === 0 ? (
        <p className="font-sans text-sm text-ink-muted">
          No section timings for this piece yet. They are recorded per heading, so a teaching with
          no subheadings — or one nobody has read through — has none.
        </p>
      ) : (
        <>
      <p className="kicker mb-3 text-ink-subtle">Time spent, by section</p>
      <ul className="flex flex-col gap-2">
        {row.sections.map((section) => (
          <li key={section.id}>
            <div className="flex items-baseline justify-between gap-4 font-sans text-sm">
              <span className="text-ink-strong">{headingWords(section.id)}</span>
              <span className="tabular text-ink-muted">
                {duration(section.seconds)} · {percent(section.share)}
              </span>
            </div>
            <div aria-hidden className="mt-1 h-1 overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-gold/70"
                style={{ width: `${Math.max(1, section.share * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
        </>
      )}

      {row.review && (
        <p className="mt-4 rounded-2xl border border-hairline bg-surface px-4 py-3 font-sans text-sm text-ink-muted">
          <span className="kicker mb-1 block text-ink-subtle">Sent back</span>
          {row.review.note}
        </p>
      )}

      {actions && <div className="mt-4 flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
