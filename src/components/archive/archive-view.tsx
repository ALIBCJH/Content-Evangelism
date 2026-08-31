import * as React from 'react'
import Link from 'next/link'
import { siteUrl } from '@/lib/content'
import { cn } from '@/lib/utils'
import { listRealRows, type RealRow } from '@/lib/rows'
import { Breadcrumbs, type Crumb } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { toArchiveItems } from '@/lib/archive-items'
import { readInsight } from '@/lib/insight'
import { ArchiveList } from '@/components/archive/archive-list'

/**
 * A listing of writing: the whole archive at /articles, and the same
 * component filtered to a section or an author.
 *
 * A band carries the title; under it a strip of controls, which is where
 * the count lives, and under that the writing: the newest piece given the
 * room to be read as a front page, then the rest as rows. Every card is two parts — the
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
  /** The listing's name, set as the page's headline. */
  title: string
  /** See ArchiveList.quietTitle — set on the front page only. */
  quietTitle?: boolean
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
  title,
  quietTitle,
  purpose,
  emptyMessage,
  filter,
  crumbs,
  collection,
}: ArchiveViewProps) {
  /* listRealRows already returns real, published pieces newest first. */
  const source = await listRealRows()

  /* What the site's own counters know about which teachings are read.
     They are per page and anonymous — see insight.ts — which is exactly
     enough to order a listing by and not enough to identify anybody. A
     deployment with no store attached returns nothing and the listing
     simply has no "most read" to offer. */
  const views: Record<string, number> = {}
  try {
    for (const page of await readInsight()) views[page.path] = page.views
  } catch {
    /* Counters are a nicety here; the archive is not held up for them. */
  }
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

  /* Rendered here, on the server, and handed to the client list that draws
     the band around it — so the trail, the title and the standfirst are in
     the markup a crawler is given, as they were when this component drew
     the band itself. */
  const header = (
    <div className="min-w-0">
      {crumbs && <Breadcrumbs className="mb-4" crumbs={crumbs} />}
      {/* The subject chips that stood beside the title are gone, so the
          two-column grid they were the second column of goes too. */}
      <h1
        className={`font-display text-[1.75rem] font-medium leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.375rem] ${
          purpose ? 'mb-3' : ''
        }`}
      >
        {title}
      </h1>
      {purpose && (
        <p className="max-w-[660px] text-pretty text-[0.9375rem] leading-[1.7] text-ink-700">
          {purpose}
        </p>
      )}
    </div>
  )

  return (
    <main>
      {collectionLd && <JsonLd data={collectionLd} />}

      {/* ── The band ─────────────────────────────────────────────── */}
      {/* A signpost, not a page of its own — and now one band rather than
          two. The search box used to sit in a full-width strip of its own
          directly under this one, so a reader met two bands, one word and
          one input before any writing. On the same line they cost the
          height of the taller of them, and the archive moves up a band.

          Nothing is listed to search when the archive is empty, so that
          case keeps the plain band and the list is not rendered at all. */}
      {rows.length === 0 ? (
        <>
          <section className="border-b border-rule bg-raised">
            <div className="shell pb-6 pt-6">{header}</div>
          </section>
          <div className="shell py-20 text-center">
            <p className="font-display text-xl text-ink-muted">{emptyMessage}</p>
            <p className="mt-6">
              <Link
                href="/"
                className="font-mono text-[0.6875rem] tracking-[0.08em] text-navy transition-colors hover:text-gold"
              >
                READ THE WHOLE ARCHIVE →
              </Link>
            </p>
          </div>
        </>
      ) : (
        /* The listing gets its own band — see `.reading-front`. The
           archive used to be the darkest strip on a page whose masthead,
           search bar and closing band are all lighter than it, which put
           the furniture in front of the writing. */
        <div className="reading-front">
          <ArchiveList items={toArchiveItems(rows, views)} header={header} quietTitle={quietTitle} />
        </div>
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
