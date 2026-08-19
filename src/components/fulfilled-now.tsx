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
 * The rest of why it works is that it is loud: a heavy label on a coloured
 * bar, numerals that carry, and headlines set in the sans rather than the
 * reading face. This rail is set the same way, in gold, which is the
 * ministry's colour and not a news channel's orange.
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
      {/* The heading is set to be seen from across the column: uppercase,
          weighted, and sitting on a solid gold bar rather than a hairline.
          The rule still marks the words rather than the top of a box. */}
      <p
        id="fulfilled-now"
        className="inline-block border-b-[3px] border-gold pb-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-navy"
      >
        Recently fulfilled
      </p>

      <ol className="mt-3">
        {records.map((record, index) => (
          <li key={record.id} className="border-b border-rule last:border-b-0">
            {/* The whole row is the target, not the title alone: this rail
                exists to be clicked from, and a two-line headline is a
                small thing to hit beside four lines of card. */}
            <Link
              href={recordHref(record)}
              className="group -mx-2 flex gap-3 rounded-tile px-2 py-3.5 transition-colors hover:bg-chip-gold/50"
            >
              {/* The numeral is the whole device — set in the sans at a
                  weight that carries, and in gold, which is the site's own
                  accent rather than a borrowed one. */}
              <span
                aria-hidden
                className="tabular w-5 shrink-0 text-[1.25rem] font-bold leading-[1.1] text-gold"
              >
                {index + 1}
              </span>
              <span className="block min-w-0">
                <span className="block text-balance text-[0.9375rem] font-semibold leading-[1.3] text-navy transition-colors group-hover:text-gold-ink">
                  {record.title}
                </span>
                <span className="mt-1.5 block font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-subtle">
                  <span className="text-gold-ink">{record.location}</span>
                  <span aria-hidden className="mx-1.5">
                    ·
                  </span>
                  {/^\d{4}-\d{2}-\d{2}$/.test(record.published)
                    ? format(parseISO(record.published), 'd MMM yyyy')
                    : 'Date to confirm'}
                </span>
              </span>
            </Link>
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
