import Link from 'next/link'
import Image from 'next/image'
import type { ArchiveItem } from '@/lib/archive-items'
import { Posted } from '@/components/posted'
import { TeachingArt } from '@/components/archive/teaching-art'

/**
 * One teaching in the archive: the section, the headline, and a picture
 * on the right.
 *
 * The shape a news front page uses, and this one uses it for the reason
 * news fronts do rather than because they do. A column of bare headlines
 * gives the eye nowhere to stop, so five teachings read as one grey block
 * and a reader scans none of them. Something on every row to land on is
 * what makes a listing scannable instead of merely complete.
 *
 * The picture is on the right and the headline on the left, which is the
 * opposite of `TeachingRow` — the earlier answer to this question, kept
 * beside this one. It matters more than it sounds. A reader scanning a
 * listing is reading headlines, not looking at pictures, and a picture in
 * the left margin puts a hundred and twenty pixels of photograph in front
 * of every headline before the reader reaches the first word of any of
 * them. On the right the headlines all start at the same left edge, in
 * one column, and the pictures are what the eye goes to only when a
 * headline has already stopped it.
 *
 * Ruled, not carded. A card costs a border and padding on both edges, and
 * on a 390px phone that is thirty or forty pixels of measure taken from
 * the only thing on the row that matters. A hairline says "these are
 * separate things" for one pixel.
 *
 * The section is stated in words above the headline. It used to be left
 * to the colour of the field beside it, which said nothing to a reader
 * who had not learnt the code and nothing at all to one who cannot see
 * colour — and it freed the field's palette to do the job it is better
 * at, which is telling one row from the next. See `paletteFor`.
 */
export function PieceRow({ item, priority = false }: { item: ArchiveItem; priority?: boolean }) {
  return (
    <article className="group relative border-b border-rule py-5 last:border-b-0">
      <div className="flex items-start justify-between gap-4 sm:gap-6">
        <div className="min-w-0 flex-1">
          {/* The section, as a word. Gold rather than the ministry's navy
              because it is a label on a headline and not part of it — the
              same mark every kicker on this site carries. */}
          <p className="kicker mb-1.5 text-gold-ink">{item.category}</p>

          <h3 className="text-pretty font-apparatus text-[1.0625rem] font-bold leading-[1.3] tracking-[-0.011em] text-navy sm:text-[1.125rem]">
            <Link href={item.href} data-track="read-article" className="focus-ring">
              {/* The whole row follows the headline, so the small print
                  under it is not a second link to the same place. */}
              <span aria-hidden className="absolute inset-0" />
              <span className="headline-link">{item.title}</span>
            </Link>
          </h3>

          {/* Two facts. The section is above the headline now, so it is
              not repeated here; what is left is when it was published and
              what it will cost to read, which is what a reader deciding
              between two teachings actually weighs. */}
          <p className="kicker mt-2 leading-[1.5] text-ink-subtle">
            <Posted iso={item.publishedAt} dated={item.dated} />
            <span aria-hidden className="mx-1.5">·</span>
            <span className="tabular">{item.readMinutes}</span> min
          </p>
        </div>

        {/* The picture. A photograph where the teaching has one — its own
            listing crop, its poster, or a figure lifted out of the body,
            in that order — and the section's own field where it has
            none. See `bodyFigure` for why the widest figure is the one
            taken, and `TeachingArt` for why the field is not a blank. */}
        <span
          className="relative aspect-[16/10] w-[7.5rem] shrink-0 overflow-hidden rounded-md bg-surface-2 sm:w-[9.5rem]"
          style={{ containerType: 'inline-size' }}
        >
          {item.thumbnail ? (
            <Image
              src={item.thumbnail.src}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 640px) 120px, 152px"
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
      </div>
    </article>
  )
}
