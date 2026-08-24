'use client'

import Link from 'next/link'
import type { PieceRow } from '@/lib/desk-overview'
import { DEAD_END_RATE, ENOUGH_TO_JUDGE } from '@/lib/desk-overview'
import { count, percent } from './format'

/**
 * The two lists that are actually editorial advice.
 *
 * A top ten tells the desk what it already knows. These are the pieces
 * something can be done about: the ones readers open and abandon, and the
 * ones nobody opens at all.
 */

function List({
  title,
  explain,
  rows,
  empty,
  figure,
}: {
  title: string
  explain: string
  rows: PieceRow[]
  empty: string
  figure: (row: PieceRow) => string
}) {
  return (
    <div>
      <h3 className="font-display text-lg text-ink-strong">{title}</h3>
      <p className="mt-1.5 font-sans text-sm leading-relaxed text-ink-muted">{explain}</p>
      {rows.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-hairline bg-surface px-5 py-4 font-sans text-sm text-ink-muted">
          {empty}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
          {rows.map((row) => (
            <li key={row.slug} className="flex items-baseline justify-between gap-4 px-5 py-3">
              <Link
                href={`/articles/${row.slug}`}
                className="font-sans text-sm text-ink-strong transition-colors hover:text-gold"
              >
                {row.title}
              </Link>
              <span className="tabular shrink-0 font-sans text-sm text-ink-muted">
                {figure(row)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function FindingsBand({ deadEnds, unread }: { deadEnds: PieceRow[]; unread: PieceRow[] }) {
  return (
    <section aria-labelledby="band-findings" className="grid gap-8 lg:grid-cols-2">
      <h2 id="band-findings" className="sr-only">
        What the numbers suggest
      </h2>

      <List
        title="Opened, then left"
        explain={`At least ${ENOUGH_TO_JUDGE} visits and fewer than ${percent(
          DEAD_END_RATE
        )} of them reaching the end. Usually the opening rather than the teaching — the headline promised something the first paragraph did not.`}
        rows={deadEnds}
        empty="Nothing is being abandoned. Either the writing is holding people, or there are not yet enough readings to tell."
        figure={(row) => `${percent(row.finishRate)} of ${count(row.views)}`}
      />

      <List
        title="On the site, barely read"
        explain="Published and indexed, and almost nobody has opened it. Worth a link from somewhere, a better headline, or a place on the front page."
        rows={unread}
        empty="Everything published is being found."
        figure={(row) => `${count(row.viewsEver)} ever`}
      />
    </section>
  )
}
