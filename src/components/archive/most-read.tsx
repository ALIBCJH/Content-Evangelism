import Link from 'next/link'
import Image from 'next/image'
import type { ArchiveItem } from '@/lib/archive-items'
import { Posted } from '@/components/posted'
import { TeachingArt } from '@/components/archive/teaching-art'

/**
 * The teaching the congregation is actually reading, under the newest one.
 *
 * The front page had one thing on it that was chosen — the lead — and
 * that choice is made by a date. A date is a fair way to order an archive
 * and a poor way to answer the question a first-time reader has, which is
 * not "what is newest" but "what should I read". This answers it with the
 * only evidence the ministry has: what everybody else opened.
 *
 * It sits under the lead because the space was there. The two-column
 * front put a 560px lead beside a column of rows that ran to nearly a
 * thousand, so the centre of the page ended in four hundred pixels of
 * nothing — and filling that with a fourth headline would have been
 * furniture. This is the one thing that could go there and mean
 * something the rest of the page does not already say.
 *
 * "Most read" has been on this site once before, as a sort control at the
 * top of the listing, and it was removed for asking a reader to order a
 * collection before being shown anything in it. The note left behind said
 * that if it came back it should come back as a band of its own, further
 * down, where it is an answer rather than a question. This is that.
 *
 * It draws nothing when there is nothing to draw. A count of zero is not
 * a quiet week, it is a site with no counters attached — and "most read"
 * over an archive nobody has opened is a claim rather than a fact. See
 * `pickMostRead`.
 */
export function MostRead({ item }: { item: ArchiveItem }) {
  return (
    <section
      /* Below `xl` this is not drawn at all. The phone gets the listing
         and nothing above it, which is the whole of what was asked for
         when the front page was stripped back — and a second large card
         on a 390px screen is a second screenful before the archive. */
      className="hidden xl:mt-10 xl:block"
      aria-labelledby="most-read-caption"
    >
      {/* The caption, ruled in the ministry's gold — the same shape the
          closing band and the rail use, so it reads as part of the page
          rather than as a widget dropped onto it. */}
      <div className="mb-4 flex items-baseline gap-3">
        <h2 id="most-read-caption" className="kicker whitespace-nowrap text-gold">
          Most read
        </h2>
        <span aria-hidden className="h-px flex-1 bg-rule" />
      </div>

      {/* A div, not a second <article>. The teaching this points at is
          already on the page as a row of its own, and marking the same
          piece up twice would tell anything reading the markup that the
          archive holds sixteen teachings where it holds fifteen. */}
      <div className="group relative">
        <span
          className="relative block aspect-[16/10] w-full overflow-hidden rounded-lg bg-surface-2"
          style={{ containerType: 'inline-size' }}
        >
          {item.thumbnail ? (
            <Image
              src={item.thumbnail.src}
              alt=""
              fill
              sizes="(max-width: 1279px) 0px, 33vw"
              className="object-cover"
            />
          ) : (
            <TeachingArt
              art={item.art}
              cite={item.quote?.cite}
              category={item.category}
              className="absolute inset-0"
            />
          )}
        </span>

        {/* A step down from the lead rather than a match for it: two
            things the same size on one page are two leads, and the reader
            is then told twice that something is the most important thing
            here. */}
        <h3 className="mt-5 text-pretty font-article text-[1.4375rem] font-bold leading-[1.2] tracking-[-0.01em] text-navy">
          <Link href={item.href} data-track="read-most-read" className="focus-ring">
            <span aria-hidden className="absolute inset-0" />
            <span className="headline-link headline-link--drawn">{item.title}</span>
          </Link>
        </h3>

        <p className="kicker mt-3 leading-[1.5] text-ink-subtle">
          <Posted iso={item.publishedAt} dated={item.dated} />
          <span aria-hidden className="mx-1.5">·</span>
          <span className="tabular">{item.readMinutes}</span> min
        </p>
      </div>
    </section>
  )
}
