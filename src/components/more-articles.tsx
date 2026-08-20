import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import type { RealRow } from '@/lib/rows'

/**
 * The rail beside a teaching: more of the writing.
 *
 * The prophetic record used to stand here, on the reasoning that a
 * teaching about repentance is where a reader most wants the ministry's
 * own evidence. It reads as a change of subject: somebody halfway through
 * a teaching is reading, and what belongs in their eyeline is the next
 * thing to read — not a different archive with a different claim on their
 * attention. The record is a click away in the masthead and at the foot
 * of every page.
 *
 * Numbered, because an ordered short list is read as one object rather
 * than five, and a reader who starts it tends to finish it. Set in the
 * apparatus face and ruled in gold, like the rail it replaces.
 *
 * These are deliberately not the pieces the foot of the article offers.
 * The same five teachings in two places is one recommendation wearing two
 * hats — so the page hands this rail what its own close does not carry.
 *
 * No state, so no client bundle.
 */
export function MoreArticles({ rows }: { rows: RealRow[] }) {
  if (rows.length === 0) return null

  return (
    <section aria-labelledby="more-articles" className="font-apparatus">
      <p
        id="more-articles"
        className="inline-block border-b-[3px] border-gold pb-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-navy"
      >
        More articles
      </p>

      <ol className="mt-3">
        {rows.map((row, index) => (
          <li key={row.slug} className="border-b border-rule last:border-b-0">
            {/* The whole row is the target: this rail exists to be clicked
                from, and a two-line headline is a small thing to hit. */}
            <Link
              href={row.href}
              className="group -mx-2 flex gap-3 rounded-tile px-2 py-3.5 transition-colors hover:bg-chip-gold/50"
            >
              <span
                aria-hidden
                className="tabular w-5 shrink-0 text-[1.25rem] font-bold leading-[1.1] text-gold"
              >
                {index + 1}
              </span>
              <span className="block min-w-0">
                <span className="block text-balance text-[0.9375rem] font-semibold leading-[1.3] text-navy transition-colors group-hover:text-gold-ink">
                  {row.title}
                </span>
                <span className="mt-1.5 block font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-subtle">
                  <span className="text-gold-ink">{row.category}</span>
                  <span aria-hidden className="mx-1.5">
                    ·
                  </span>
                  {format(parseISO(row.publishedAt), 'd MMM yyyy')}
                  <span aria-hidden className="mx-1.5">
                    ·
                  </span>
                  <span className="tabular">{row.readMinutes}</span> MIN
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-[0.6875rem] leading-[1.55] text-ink-subtle">
        <Link href="/" className="text-gold-ink underline underline-offset-2">
          The whole archive
        </Link>
      </p>
    </section>
  )
}
