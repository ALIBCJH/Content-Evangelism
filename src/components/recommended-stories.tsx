import Link from 'next/link'
import type { RealRow } from '@/lib/rows'

/**
 * What to read next, offered part-way through rather than at the end.
 *
 * The site already offers this — at the foot of the piece, under
 * `ContinueReading`. The trouble with the foot is that a reader has to
 * finish to reach it, and a third of them do; the rest leave from
 * somewhere in the middle having been offered nothing at all. This is
 * the same idea placed where people actually are.
 *
 * Deliberately plain: a kicker, and titles as a bulleted list. It is an
 * aside in the middle of a teaching, and anything with pictures in it
 * would compete with the teaching rather than sit inside it — the reader
 * is here to read this one, and the list should be easy to pass over.
 */
export function RecommendedStories({ rows }: { rows: RealRow[] }) {
  if (rows.length === 0) return null

  return (
    <aside
      aria-labelledby="recommended-stories"
      className="my-12 border-y border-rule-soft py-7"
    >
      <p id="recommended-stories" className="kicker mb-4 text-ink-subtle">
        Recommended stories
      </p>
      <ul className="flex flex-col gap-3.5">
        {rows.map((row) => (
          <li key={row.slug} className="flex gap-3">
            {/* The gold is the site's own accent and the one thing here
                that is not text: enough to mark a list, not enough to
                pull a reader out of the paragraph they were in. */}
            <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            <Link
              href={row.href}
              data-track="read-article"
              className="focus-ring font-apparatus text-[1rem] font-semibold leading-[1.35] text-navy transition-colors hover:text-gold-ink"
            >
              {row.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
