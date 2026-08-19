'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { recordHref, type ProphecyRecord } from '@/lib/prophecies'
import { byScore, score } from '@/lib/search-docs'
import { posterSrc } from '@/lib/youtube'
import { DatedRail, DatedRailItem } from '@/components/archive/dated-rail'
import { FulfilledBadge } from '@/components/prophecy/fulfilled-badge'
import { SearchSummary, SectionSearch } from '@/components/archive/section-search'

/**
 * The prophecy archive: every record on the dated rail, and a box that
 * searches them.
 *
 * A reader looking for one record knew what they wanted — the country, the
 * subject, sometimes the date — and had no way to say so on this page. The
 * box takes all three: "colombia", "earthquake", "july 2026", or the
 * record id the desk cites.
 *
 * The rendering happens here rather than on the page because a filtered
 * list needs to know what was typed. What is rendered is unchanged: the
 * same rail the writing archive uses, and the same card.
 */
export function RecordArchive({
  records,
  header,
}: {
  records: ProphecyRecord[]
  /** The band's title, rendered on the server and handed in. */
  header?: React.ReactNode
}) {
  const [query, setQuery] = React.useState('')

  const shown = React.useMemo(() => {
    if (!query.trim()) return records
    return byScore(records, (record) =>
      score(query, [
        { text: record.title, weight: 10 },
        { text: record.location, weight: 8 },
        { text: record.subject, weight: 8 },
        { text: record.tags.join(' '), weight: 6 },
        { text: record.date, weight: 5 },
        { text: record.rid, weight: 5 },
        { text: record.summary, weight: 3 },
        { text: record.fulfilled ? 'fulfilled' : 'awaiting', weight: 3 },
      ])
    )
  }, [records, query])

  return (
    <>
      <section className="border-b border-rule bg-raised">
        <div className="shell flex flex-wrap items-center gap-x-4 gap-y-4 py-5 sm:gap-x-8">
          {header}
          <SectionSearch
            value={query}
            onChange={setQuery}
            label="Search the prophecy records"
          />
        </div>
      </section>

      <section className="shell pb-24 pt-9">
        {/* How many there are and how they are ordered — until a search
            is running, when the line below says both better. */}
        {!query.trim() && (
          <div className="flex items-center justify-between pb-6 pt-2">
            <span className="kicker-lg text-ink-subtle">
              {records.length} {records.length === 1 ? 'record' : 'records'}
            </span>
            <span className="kicker-lg text-ink-subtle">Newest first</span>
          </div>
        )}

        <SearchSummary
          query={query}
          count={shown.length}
          noun="record"
          onClear={() => setQuery('')}
        />

        {shown.length === 0 ? (
          <p className="rounded-panel border border-rule bg-card px-6 py-10 text-center text-[0.9375rem] text-ink-muted">
            No record matches &ldquo;{query.trim()}&rdquo;. The archive holds{' '}
            {records.length} in all.
          </p>
        ) : (
          /* The rail is shared with the article archive — see dated-rail.
             A record whose year is still to be confirmed leaves its marker
             unlabelled rather than printing a placeholder dash. */
          <DatedRail>
            {shown.map((record) => (
              <DatedRailItem key={record.id} year={record.year === '—' ? null : record.year}>
                <Link
                  href={recordHref(record)}
                  className="card card-glow card-interactive my-3 flex flex-col items-start gap-6 p-5 sm:ml-8 sm:p-8 lg:flex-row lg:gap-7"
                >
                  <span className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden rounded-tile border border-rule bg-navy-deep lg:w-[260px]">
                    <Image
                      src={posterSrc(record.video)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 260px, 100vw"
                      className="object-cover"
                    />
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-1/2 flex h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-plate-deep/80"
                    >
                      <svg width="13" height="16" viewBox="0 0 20 24" fill="#F7F4EC">
                        <path d="M2 2l16 10L2 22z" />
                      </svg>
                    </span>
                  </span>

                  <span className="block min-w-0 flex-1">
                    <span className="mb-3.5 flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[0.6875rem] tracking-[0.08em] text-navy">
                        {record.date}
                      </span>
                      <span className="kicker rounded-chip border border-gold-pale/70 px-2.5 py-1 text-gold">
                        Primary Source
                      </span>
                      {record.fulfilled && <FulfilledBadge />}
                    </span>

                    <span className="mb-3.5 block text-balance font-display text-[1.375rem] font-medium leading-[1.15] text-navy sm:text-[1.875rem]">
                      {record.title}
                    </span>

                    <span className="mb-4 block max-w-[720px] text-[0.9375rem] leading-[1.7] text-ink-muted">
                      {record.summary}
                    </span>

                    <span className="flex flex-wrap items-center justify-between gap-4 border-t border-rule-soft pt-4">
                      <span className="flex flex-wrap gap-2">
                        {record.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-chip bg-chip px-3 py-1.5 text-xs text-ink-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                      <span className="whitespace-nowrap font-mono text-[0.6875rem] text-navy">
                        VIEW RECORD →
                      </span>
                    </span>
                  </span>
                </Link>
              </DatedRailItem>
            ))}
          </DatedRail>
        )}
      </section>
    </>
  )
}
