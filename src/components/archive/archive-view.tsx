import * as React from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { CATEGORIES, siteUrl, topicHref, type Category } from '@/lib/content'
import { listRealRows, type RealRow } from '@/lib/rows'
import { Breadcrumbs, type Crumb } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
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
  /** Narrows the listing; omitted means the whole archive. */
  filter?: (row: RealRow) => boolean
  /** Breadcrumb trail above the header, for listings below the root. */
  crumbs?: Crumb[]
  /**
   * Emits CollectionPage + ItemList structured data. A listing page that
   * declares what it lists, in order, is what lets Google carry the whole
   * set into a result rather than treating the page as loose prose.
   */
  collection?: { name: string; description: string; path: string }
}

/**
 * Links to every section that has something filed under it.
 *
 * The topic pages are the only ranking surface the five off-menu sections
 * have, and nothing on the site linked to them except a breadcrumb on an
 * article a reader had already found. The archive is the most linked page
 * here, so this is where they belong.
 */
function TopicStrip({ categories }: { categories: Category[] }) {
  if (categories.length < 2) return null
  return (
    /* A ruled band rather than a paragraph of links: it reads as the
       section bar of a publication, and it closes the masthead in one
       rule instead of the two that used to stack here. */
    <nav aria-label="Sections" className="mb-10 border-y border-thread py-3.5">
      <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <li className="kicker text-ink-subtle">Sections</li>
        {categories.map((category) => (
          <li key={category}>
            <Link
              href={topicHref(category)}
              className="focus-ring font-sans text-[0.8125rem] tracking-[0.04em] text-ink-muted transition-colors hover:text-gold"
            >
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
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
  crumbs,
  children,
}: {
  kicker: string
  title: string
  purpose?: string
  count?: number
  crumbs?: Crumb[]
  children: React.ReactNode
}) {
  return (
    <main className="shell pb-8">
      <header className="pt-12 md:pt-16">
        {crumbs && <Breadcrumbs className="mb-5 [&_ol]:justify-start" crumbs={crumbs} />}
        <p className="kicker mb-4 text-ink-subtle">
          {kicker}
          {count !== undefined && ` · ${count} ${count === 1 ? 'piece' : 'pieces'}`}
        </p>
        <h1 className="mb-4 max-w-[18ch] text-balance font-display text-[2.4rem] font-light leading-[1.04] tracking-[-0.02em] text-ink-strong sm:text-[3rem] md:text-[3.4rem]">
          {title}
        </h1>
        {purpose && (
          <p className="mb-9 max-w-[46ch] text-pretty font-display text-lg font-light italic leading-[1.5] text-ink-muted sm:text-xl">
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
  filter,
  crumbs,
  collection,
}: ArchiveViewProps) {
  /* listRealRows already returns real, published pieces newest first. */
  const source = await listRealRows()
  const rows = (filter ? source.filter(filter) : source).map((r) => ({
    slug: r.slug,
    href: r.href,
    title: r.title,
    dek: r.dek,
    category: r.category as string,
    publishedAt: r.publishedAt,
    readMinutes: r.readMinutes,
    body: r.body,
  }))

  /* The listing, as structured data: what this page collects and the
     order it collects it in. */
  const collectionLd = collection && {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${siteUrl}${collection.path}`,
    url: `${siteUrl}${collection.path}`,
    name: collection.name,
    description: collection.description,
    isPartOf: { '@id': `${siteUrl}/#website` },
    inLanguage: 'en',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: rows.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: rows.map((row, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}${row.href}`,
        name: row.title,
      })),
    },
  }

  if (rows.length === 0) {
    return (
      <Shell kicker={kicker} title={title} purpose={purpose} crumbs={crumbs}>
        <p className="border-t border-thread pb-10 pt-10 font-display text-lg font-light italic text-ink-muted">
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
      readMinutes: row.readMinutes,
    }
    const bucket = grouped.get(label)
    if (bucket) bucket.push(piece)
    else grouped.set(label, [piece])
  }

  const months: ArchiveMonth[] = Array.from(grouped, ([label, pieces]) => ({ label, pieces }))

  /* Only on the whole archive: a topic page linking to its siblings adds
     nothing a reader wants, and the breadcrumb already goes back up. */
  const liveCategories = filter
    ? []
    : CATEGORIES.filter((category) => source.some((row) => row.category === category))

  return (
    <Shell kicker={kicker} title={title} purpose={purpose} count={rows.length} crumbs={crumbs}>
      {collectionLd && <JsonLd data={collectionLd} />}
      <TopicStrip categories={liveCategories} />
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
            readMinutes={lead.readMinutes}
          />
        }
      />

      <div className="mt-8 border-t border-thread py-12 text-center">
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
