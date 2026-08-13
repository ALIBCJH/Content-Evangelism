import * as React from 'react'
import Link from 'next/link'
import { siteUrl } from '@/lib/content'
import { cn } from '@/lib/utils'
import { listRealRows, type RealRow } from '@/lib/rows'
import { Breadcrumbs, type Crumb } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { ArticleCard } from '@/components/archive/article-card'

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
        <section className="shell pb-24 pt-6">
          {/* What is left of the filter row: the ordering, which the list
              does not state for itself. The section chips are gone. */}
          <div className="mb-6 flex items-center justify-end border-b border-rule pb-4">
            <span className="kicker-lg text-ink-subtle">Newest first</span>
          </div>

          {/* The year prints only where it changes, so a run of pieces
              from one year reads as a block rather than repeating. */}
          {/* The cascade.
              From `lg` up the cards take a little under two-thirds of the
              shell and alternate edge to edge, each pulled up so its corner
              laps the one before it. The lap is the thing to get right: it
              is 28px against the card's own 32px of padding, so what a card
              covers is always the previous card's margin and never a word
              of it. Hovering lifts a card clear of its neighbours.

              Below `lg` none of it applies. Cards go full width and stack
              in order, because a stagger on a 390px screen is not a
              composition, it is two columns of forty characters. */}
          <ol>
            {rows.map((row, index) => (
              <li
                key={row.slug}
                className={cn(
                  'relative transition-[z-index] hover:z-10',
                  'lg:w-[62%]',
                  index > 0 && 'mt-6 lg:-mt-7',
                  index % 2 === 1 && 'lg:ml-auto'
                )}
              >
                <ArticleCard row={row} latest={index === 0} />
              </li>
            ))}
          </ol>
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
