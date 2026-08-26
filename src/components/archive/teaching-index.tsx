import * as React from 'react'
import Link from 'next/link'
import type { ArchiveItem } from '@/lib/archive-items'
import { datedGroups, ungrouped, type DatedGroup } from '@/lib/dated-groups'

/**
 * Everything below the lead, as an index.
 *
 * The rows under the front page's lead used to carry a picture each, and
 * for most of the archive that picture was a generated field belonging to
 * the section rather than to the teaching — so a column of them was the
 * same coloured band four times over, and the one thing a mark on a row
 * is for, giving the eye somewhere to land, was the one thing it did not
 * do. Four identical marks are worse than none: they cost a third of the
 * width of every headline and return nothing for it.
 *
 * So below the lead there are no pictures at all. What orders the column
 * instead is the two things that are actually different from row to row —
 * the day it was published, as a heading over the run that arrived
 * together, and the teaching's place in the archive as a number. That is
 * an index, which is the right thing for a reader who has already passed
 * the newest teaching and is looking for one they have not read.
 *
 * It also settles the picture question by not asking it. A teaching with
 * no artwork is not a worse row here; it is the same row.
 *
 * Deep ink rather than the navy the headlines carried. Navy is the
 * ministry's colour and it is right on a card, where it is one headline
 * with air round it; down a column of a dozen it reads as a list of links
 * rather than a list of teachings. The near-black holds the page.
 */
export function TeachingIndex({
  items,
  /**
   * The number the first row carries. Two on the archive, where the lead
   * above it is the first.
   */
  startAt = 2,
  /**
   * Whether the listing is in date order, and so whether the day headings
   * mean anything. False for search results, which are ordered by how
   * well they match — see `ungrouped`.
   */
  dated = true,
}: {
  items: ArchiveItem[]
  startAt?: number
  dated?: boolean
}) {
  const groups: DatedGroup<ArchiveItem>[] = dated
    ? datedGroups(items, startAt)
    : ungrouped(items, startAt)

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.date ?? 'all'} aria-label={group.date ?? undefined}>
          {group.date && (
            /* A heading, not a caption: it names the run under it, and a
               reader moving by headings should land on the days. */
            <h3 className="kicker mb-1 text-ink-subtle">{group.date}</h3>
          )}
          <ol className="divide-y divide-rule-soft">
            {group.entries.map((entry) => (
              <li key={entry.item.slug}>
                <Row entry={entry} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

function Row({ entry }: { entry: { number: number; item: ArchiveItem } }) {
  const { item, number } = entry
  return (
    <article className="group relative grid grid-cols-[2.25rem_minmax(0,1fr)] items-start py-4">
      {/* Where this sits in the archive. Padded to two digits so a column
          of them is a column rather than a ragged edge, and tabular so
          the ones and the eights are the same width. */}
      <span aria-hidden className="kicker tabular pt-[0.3rem] text-gold">
        {String(number).padStart(2, '0')}
      </span>

      <div className="min-w-0">
        <h3 className="text-pretty font-article text-[1.125rem] font-normal leading-[1.3] tracking-[-0.006em] text-ink sm:text-[1.1875rem]">
          <Link href={item.href} data-track="read-article" className="focus-ring">
            {/* The whole row follows the headline, so the line under it
                is not a second link to the same place. */}
            <span aria-hidden className="absolute inset-0" />
            <span className="headline-link">{item.title}</span>
          </Link>
        </h3>

        {/* The section and the length. Not the date — it is the heading
            over this run, and printing it again on every row would be the
            same fact four times down one column. */}
        <p className="kicker mt-1.5 leading-[1.5] text-ink-subtle">
          {item.category}
          <span aria-hidden className="mx-1.5">
            ·
          </span>
          <span className="tabular">{item.readMinutes}</span> min
        </p>
      </div>
    </article>
  )
}
