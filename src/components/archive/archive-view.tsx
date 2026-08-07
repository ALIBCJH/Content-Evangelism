import * as React from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { listRealRows } from '@/lib/rows'
import { Opener } from '@/components/archive/opener'
import {
  ArchiveMonths,
  type ArchiveMonth,
  type ArchivePiece,
} from '@/components/archive/archive-months'

/**
 * The archive: every published piece, newest first, grouped by month with
 * the newest opened in place at its head.
 *
 * Only `/` renders this today — the section pages carry Coming Soon banners
 * until they open — but it stays a component so the page file says what the
 * page is rather than how the list is built.
 */

export interface ArchiveViewProps {
  /** Small caps label above the title. */
  kicker: string
  title: string
  /** The italic line under the title. */
  purpose?: string
  /** Shown when nothing has been published yet. */
  emptyMessage: string
}

/** The opening line of a piece — what the reader sees in the archive. */
function openingLine(body: string | undefined, dek: string): string {
  if (!body) return dek
  const first = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('## ') && !block.startsWith('> '))
  return first ?? dek
}

function Shell({
  kicker,
  title,
  purpose,
  count,
  children,
}: {
  kicker: string
  title: string
  purpose?: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <main className="shell pb-8">
      <header className="pt-12 md:pt-16">
        <p className="kicker mb-4 text-ink-subtle">
          {kicker}
          {count !== undefined && ` · ${count} ${count === 1 ? 'piece' : 'pieces'}`}
        </p>
        <h1 className="mb-4 font-display text-[2.4rem] font-light leading-[1.04] tracking-[-0.02em] text-ink-strong sm:text-[3rem] md:text-[3.4rem]">
          {title}
        </h1>
        {purpose && (
          <p className="mb-11 max-w-lg border-b border-thread pb-11 font-display text-lg font-light italic leading-[1.5] text-ink-muted sm:text-xl">
            {purpose}
          </p>
        )}
      </header>
      {children}
    </main>
  )
}

export async function ArchiveView({
  kicker,
  title,
  purpose,
  emptyMessage,
}: ArchiveViewProps) {
  /* listRealRows already returns real, published pieces newest first. */
  const rows = (await listRealRows()).map((r) => ({
    slug: r.slug,
    href: r.href,
    title: r.title,
    dek: r.dek,
    category: r.category as string,
    publishedAt: r.publishedAt,
    body: r.body,
  }))

  if (rows.length === 0) {
    return (
      <Shell kicker={kicker} title={title} purpose={purpose}>
        {/* The purpose line already closes with a rule, so this doesn't
            open with one — two hairlines that close together read as a
            mistake rather than as structure. */}
        <p className="pb-10 font-display text-lg font-light italic text-ink-muted">
          {emptyMessage}
        </p>
        <div className="border-t border-thread py-10 text-center">
          <Link
            href="/"
            className="border-b border-gold-ink pb-0.5 font-sans text-[0.8125rem] font-medium tracking-[0.05em] text-gold transition-colors hover:text-ink"
          >
            Read the whole archive
          </Link>
        </div>
      </Shell>
    )
  }

  const [lead, ...rest] = rows

  /* Group the remainder by month, newest month first. Insertion order is
     already correct because `rows` is sorted, so a Map preserves it.

     The lead's own month is seeded first even when every other piece in it
     has been consumed by the opener — otherwise a lone newest article would
     lose its month heading. */
  const leadDate = parseISO(lead.publishedAt)
  const grouped = new Map<string, ArchivePiece[]>([[format(leadDate, 'MMMM yyyy'), []]])
  for (const row of rest) {
    const date = parseISO(row.publishedAt)
    const label = format(date, 'MMMM yyyy')
    const piece: ArchivePiece = {
      key: row.slug,
      href: row.href,
      dateLabel: format(date, 'EEEE d MMMM'),
      publishedAt: row.publishedAt,
      title: row.title,
      open: openingLine(row.body, row.dek),
      ref: row.category,
    }
    const bucket = grouped.get(label)
    if (bucket) bucket.push(piece)
    else grouped.set(label, [piece])
  }

  const months: ArchiveMonth[] = Array.from(grouped, ([label, pieces]) => ({ label, pieces }))

  return (
    <Shell kicker={kicker} title={title} purpose={purpose} count={rows.length}>
      {/* ── The archive, newest piece opened at its head ─────────── */}
      <ArchiveMonths
        months={months}
        opener={
          <Opener
            href={lead.href}
            dateLabel={format(leadDate, 'EEEE d MMMM')}
            publishedAt={lead.publishedAt}
            title={lead.title}
            body={lead.body ?? lead.dek}
            scriptureRef={lead.category}
          />
        }
      />

      <div className="mt-8 border-t border-thread py-14 text-center">
        <Link
          href="/search"
          className="border-b border-gold-ink pb-0.5 font-sans text-[0.8125rem] font-medium tracking-[0.05em] text-gold transition-colors hover:text-ink"
        >
          Search the whole archive
        </Link>
      </div>
    </Shell>
  )
}
