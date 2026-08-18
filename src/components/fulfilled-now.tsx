import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { recentlyFulfilled, recordHref } from '@/lib/prophecies'

/**
 * The rail beside a teaching: the records the ministry designates
 * fulfilled, newest first.
 *
 * A news site puts its most-read stories here and numbers them, and the
 * numbering is most of why it works — an ordered short list is read as one
 * object rather than four, and a reader who starts it tends to finish it.
 * The same device carries something better than page views here: the
 * archive is the ministry's own evidence, and a teaching about repentance
 * is the moment a reader is most likely to want to see it.
 *
 * What the device must not do is launder the claim. "Fulfilled" is the
 * ministry's designation of its own record — the archive says so on every
 * record page, and a rail that quietly drops that word's provenance while
 * borrowing a news site's authority is doing the opposite of what the
 * archive was built for. So the note under the list carries it, and every
 * line goes to the record, where the source recording and its publication
 * date are held.
 *
 * No state, so no client bundle: the records are read at build time.
 */
export function FulfilledNow({ limit = 4 }: { limit?: number }) {
  const records = recentlyFulfilled(limit)
  if (records.length === 0) return null

  return (
    <section aria-labelledby="fulfilled-now" className="font-apparatus">
      {/* The rule sits under the words rather than across the column: it
          marks the heading, not the top of a box. */}
      <p
        id="fulfilled-now"
        className="kicker inline-block border-b-2 border-gold pb-2 text-navy"
      >
        Recently fulfilled
      </p>

      <ol className="mt-4">
        {records.map((record, index) => (
          <li
            key={record.id}
            className="flex gap-3.5 border-b border-dotted border-rule py-3.5 first:pt-0"
          >
            {/* The numeral is the whole device. Set in the reading face at
                a size the headline beside it does not have to compete
                with, and in gold, which is the site's own accent rather
                than a borrowed one. */}
            <span
              aria-hidden
              className="tabular mt-[0.15rem] font-article text-[1.5rem] font-light leading-none text-gold"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <Link
                href={recordHref(record)}
                className="block text-balance font-article text-[0.9375rem] leading-[1.35] text-navy transition-colors hover:text-gold"
              >
                {record.title}
              </Link>
              <p className="mt-1.5 text-[0.75rem] leading-none text-ink-subtle">
                {record.location}
                <span aria-hidden className="mx-1.5">
                  ·
                </span>
                {/^\d{4}-\d{2}-\d{2}$/.test(record.published)
                  ? format(parseISO(record.published), 'd MMM yyyy')
                  : 'Date to confirm'}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-[0.6875rem] leading-[1.55] text-ink-subtle">
        “Fulfilled” is the ministry’s own designation of a record, not an independent verdict.
        Each record holds the original recording and its publication date.{' '}
        <Link href="/prophecies" className="text-gold-ink underline underline-offset-2">
          The archive
        </Link>
      </p>
    </section>
  )
}
