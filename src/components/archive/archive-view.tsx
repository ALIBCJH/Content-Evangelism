import * as React from 'react'
import Link from 'next/link'
import { siteUrl } from '@/lib/content'
import { cn } from '@/lib/utils'
import { listRealRows, type RealRow } from '@/lib/rows'
import { Breadcrumbs, type Crumb } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { toArchiveItems } from '@/lib/archive-items'
import { ArchiveList } from '@/components/archive/archive-list'

/**
 * A listing of writing: the whole archive at /articles, and the same
 * component filtered to a section or an author.
 *
 * A band carries the title and the count; under it a strip of controls,
 * and under that the writing: the newest piece given the room to be read
 * as a front page, then the rest as rows. Every card is two parts — the
 * Scripture the piece leads with, on the ministry's navy, and what the
 * teaching does with it.
 *
 * This component stays on the server. It is what a crawler and a reader
 * with no JavaScript get, and it is the whole archive, newest first, with
 * its structured data intact. Filtering, ordering and saving are handled
 * by the list below it, which is the only part that needs a browser.
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

  /* Only the whole archive hands off to the other one; a filtered listing
     already says what it is, and the breadcrumb goes back up. */
  const whole = !filter

  return (
    <main>
      {collectionLd && <JsonLd data={collectionLd} />}

      {/* ── The band ─────────────────────────────────────────────── */}
      <section className="border-b border-rule bg-raised">
        <div className="shell pb-9 pt-7">
          {crumbs ? (
            <Breadcrumbs className="mb-6" crumbs={crumbs} />
          ) : (
            <p className="kicker-lg mb-4 text-ink-subtle">
              {kicker}
              {rows.length > 0 && ` · ${rows.length} ${rows.length === 1 ? 'piece' : 'pieces'}`}
            </p>
          )}

          {/* The title, and the line under it where a filtered listing has
              one. The subject chips that stood beside it are gone, so the
              two-column grid they were the second column of goes too. */}
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
        <ArchiveList items={toArchiveItems(rows)} />
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
              data-track="prophecy-archive"
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
