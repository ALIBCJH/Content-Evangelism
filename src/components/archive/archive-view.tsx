import * as React from 'react'
import Link from 'next/link'
import {
  articleSubjects,
  CATEGORIES,
  siteUrl,
  topicHref,
  type Category,
} from '@/lib/content'
import { listRealRows, type RealRow } from '@/lib/rows'
import { Breadcrumbs, type Crumb } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { ArticleCard } from '@/components/archive/article-card'
import { DatedRail, DatedRailItem } from '@/components/archive/dated-rail'

/**
 * A listing of writing: the whole archive at /articles, and the same
 * component filtered to a section or an author.
 *
 * A cream band carries the title and the subjects; below it every piece
 * is a card on the dated rail, in the same language as the prophecy
 * archive. The two are the ministry's two chronologies and now read as
 * one set of pages rather than two.
 *
 * Nothing is paginated — the archive is small enough to read in one page,
 * and a reader who wants a specific thing has search.
 */

export interface ArchiveViewProps {
  /** Small caps label above the title. */
  kicker: string
  title: string
  /** The line under the title. */
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
  const rows = filter ? source.filter(filter) : source

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

  /* Only the whole archive lists its siblings; a filtered listing already
     says what it is, and the breadcrumb goes back up. */
  const whole = !filter
  const counts = whole
    ? CATEGORIES.map((category) => ({
        category,
        count: source.filter((row) => row.category === category).length,
      })).filter(({ count }) => count > 0)
    : []

  return (
    <main>
      {collectionLd && <JsonLd data={collectionLd} />}

      {/* ── The band ─────────────────────────────────────────────── */}
      <section className="border-b border-rule bg-raised">
        <div className="shell pb-14 pt-11">
          {crumbs ? (
            <Breadcrumbs className="mb-6" crumbs={crumbs} />
          ) : (
            <p className="kicker-lg mb-6 text-ink-subtle">
              {kicker}
              {rows.length > 0 && ` · ${rows.length} ${rows.length === 1 ? 'piece' : 'pieces'}`}
            </p>
          )}

          {/* With a line under the title the two columns bottom out together,
              which is how the design sets them. Without one the title would
              be left floating at the foot of a taller column, so it goes to
              the top instead. */}
          <div
            className={`grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-[72px] ${
              purpose ? 'items-end' : 'items-start'
            }`}
          >
            <div>
              <h1
                className={`font-display text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-navy sm:text-[3.625rem] ${
                  purpose ? 'mb-4' : ''
                }`}
              >
                {title}
              </h1>
              {purpose && (
                <p className="max-w-[660px] text-pretty text-[1.0625rem] leading-[1.7] text-ink-700">
                  {purpose}
                </p>
              )}
            </div>

            {whole && (
              <nav aria-label="Subjects" className="lg:border-l lg:border-rule lg:pl-10">
                <p className="kicker mb-3.5 text-ink-subtle">Browse by subject</p>
                <ul className="flex flex-wrap gap-2">
                  {articleSubjects.map((subject) => (
                    <li key={subject}>
                      <Link
                        href={`/search?q=${encodeURIComponent(subject)}`}
                        className="focus-ring inline-block rounded-chip bg-chip px-3.5 py-2 text-[0.8125rem] text-ink-700 transition-colors hover:bg-navy hover:text-card"
                      >
                        {subject}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="shell py-20 text-center">
          <p className="font-display text-xl text-ink-muted">{emptyMessage}</p>
          <p className="mt-6">
            <Link
              href="/articles"
              className="font-mono text-[0.6875rem] tracking-[0.08em] text-navy transition-colors hover:text-gold"
            >
              READ THE WHOLE ARCHIVE →
            </Link>
          </p>
        </div>
      ) : (
        <section className="shell pb-24 pt-12">
          {/* The filter row: the sections that actually hold something. */}
          <div className="mb-10 flex flex-wrap items-center justify-between gap-6 border-b border-rule pb-5">
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/articles"
                className="focus-ring rounded-chip border border-rule bg-card px-4 py-2.5 text-[0.8125rem] font-medium text-ink-700 transition-colors hover:border-gold hover:text-navy"
              >
                All Articles
              </Link>
              {counts.map(({ category }) => (
                <Link
                  key={category}
                  href={topicHref(category)}
                  className="focus-ring rounded-chip border border-rule bg-card px-4 py-2.5 text-[0.8125rem] font-medium text-ink-700 transition-colors hover:border-gold hover:text-navy"
                >
                  {category}
                </Link>
              ))}
            </div>
            <span className="kicker-lg text-ink-subtle">Newest first</span>
          </div>

          {/* The year prints only where it changes, so a run of pieces
              from one year reads as a block rather than repeating. */}
          <DatedRail>
            {rows.map((row, index) => {
              const year = row.publishedAt.slice(0, 4)
              const first = index === 0 || rows[index - 1].publishedAt.slice(0, 4) !== year
              return (
                <DatedRailItem key={row.slug} year={first ? year : null}>
                  <ArticleCard row={row} latest={index === 0} />
                </DatedRailItem>
              )
            })}
          </DatedRail>
        </section>
      )}

      {/* The other archive. It used to be a panel in a sidebar, which on a
          short listing left a column of nothing beside it; as a closing
          band it cannot collapse, and the hand-off reads as deliberate. */}
      {whole && rows.length > 0 && (
        <section className="border-t border-rule bg-raised">
          <div className="shell flex flex-wrap items-center justify-between gap-6 py-12">
            <div>
              <p className="kicker mb-2.5 text-ink-subtle">From the archive</p>
              <p className="max-w-[620px] text-pretty font-display text-[1.375rem] leading-[1.3] text-navy">
                Prophetic messages are held separately, each with its original
                recording and publication date.
              </p>
            </div>
            <Link
              href="/prophecies"
              className="focus-ring whitespace-nowrap rounded-tile border border-rule bg-card px-6 py-3.5 font-mono text-[0.6875rem] tracking-[0.08em] text-navy transition-colors hover:border-gold hover:text-gold"
            >
              PROPHECY ARCHIVE →
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
