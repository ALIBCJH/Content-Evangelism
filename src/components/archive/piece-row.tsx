import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
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
 * No section on the row at all now. It was a gold kicker above the
 * headline and it read "Teachings" eight times in fourteen rows, which is
 * a label that separates nothing while spending the line directly above
 * the only thing on the row that matters. The rail and the topic pages
 * are where a section is a thing a reader can act on.
 *
 * Which leaves the field beside a picture-less teaching carrying no
 * meaning about section, and it should not: it is keyed to the piece
 * rather than to its category precisely so that a column of them reads as
 * fourteen different things. See `paletteFor`.
 *
 * ## One row, at every width
 *
 * There was a lead here — one row drawn large at `xl`, picture above
 * headline, with a most-read card under it and the rest of the archive
 * in a second column beside them. That is a newspaper front, and it is
 * not what was asked for: a feed is one column of equal things, and the
 * reader decides which is worth their time rather than being told. So
 * the row is the whole design again, and the only thing `xl` changes is
 * that there is more room to say it in — a larger headline, the
 * standfirst under it, and a picture at the size a picture can be seen.
 *
 * `canLead` and `pickLead` are left where they are, unused. They cost
 * nothing, they are covered, and the archive may well want a lead again
 * on a page that is not this one.
 */
export function PieceRow({ item, priority = false }: { item: ArchiveItem; priority?: boolean }) {
  return (
    <article className="group relative border-b border-rule py-5 last:border-b-0 xl:py-7">
      <div className="flex items-start justify-between gap-4 sm:gap-6 xl:gap-10">
        <div className="min-w-0 flex-1">
          {/* No section label. It stood here as a gold kicker and said
              "Teachings" on eight of fourteen rows, which is a word that
              distinguishes nothing while taking the line above every
              headline — and the two places a reader can act on a section
              are the topics rail and the topic pages, both of which are
              still there. */}
          {/* Set in the teaching's own face, not the desk's.

              These headlines were `font-apparatus` — IBM Plex Sans, the
              face this site reserves for meta, rails, citations and
              questions. It is the right face for a dateline and the
              wrong one for the only words on the row that have to stop
              somebody, and it meant a reader scanning the archive was
              reading the apparatus and clicking through to a teaching
              set in something else entirely.

              `font-article` is Newsreader, which is what a teaching's
              own headline is set in — so the words a reader chooses look
              like the words they land on. It is already loaded and
              already preloaded, so the face this changes to costs the
              page nothing; a seventh family would have cost real
              kilobytes, and the note in `layout.tsx` records what that
              was measured at.

              Larger, because a serif at a sans's size reads smaller: the
              stems are thinner and the x-height is lower, so holding the
              pixel size would have made the column quieter rather than
              louder. Between the size, the darker ink of
              `.reading-front` and the rule now drawn under every one,
              the headline is the loudest thing on the row, which is what
              a listing is for. */}
          <h3 className="text-pretty font-article text-[1.1875rem] font-extrabold leading-[1.25] tracking-[-0.008em] text-navy sm:text-[1.3125rem] xl:text-[1.5rem] xl:leading-[1.22] xl:tracking-[-0.012em]">
            <Link href={item.href} data-track="read-article" className="focus-ring">
              {/* The whole row follows the headline, so the small print
                  under it is not a second link to the same place. */}
              <span aria-hidden className="absolute inset-0" />
              {/* Drawn rather than swept: on a phone there is no pointer
                  to reveal a hover underline, so without this the archive
                  is a column of bold navy text with nothing saying any of
                  it opens. See `.headline-link--drawn`. */}
              <span className="headline-link headline-link--drawn">{item.title}</span>
            </Link>
          </h3>

          {/* Two facts. The section is above the headline now, so it is
              not repeated here; what is left is when it was published and
              what it will cost to read, which is what a reader deciding
              between two teachings actually weighs. */}
          {/* The standfirst, from `xl` and clamped to two lines.

              It is what turns a column of headlines into something a
              reader can choose between: the headline says what the
              teaching is called, this says what it answers. Two lines
              because the full standfirst runs to four, and four lines on
              every row of a fifteen-row column is a page of standfirsts
              with headlines in it.

              `xl` only, and deliberately: below that the rows are what
              they were this morning, and a phone is a separate decision
              from this one rather than a consequence of it. It is
              already on every item for the search to score, so drawing
              it costs the page nothing it was not already sending. */}
          {item.dek && (
            <p className="mt-2.5 hidden font-reading text-[1rem] leading-[1.55] text-ink-700 xl:line-clamp-2">
              {item.dek}
            </p>
          )}

          <p className="kicker mt-2 flex flex-wrap items-center leading-[1.5] text-ink-500 xl:mt-3.5">
            <Posted iso={item.publishedAt} dated={item.dated} />
            <span aria-hidden className="mx-1.5">·</span>
            <span className="tabular">{item.readMinutes}</span>&nbsp;min
            {/* Only where somebody has actually said so. A heart beside a
                nought reads as a teaching offered and refused, which is
                not what an empty count means — it means nobody has been
                asked yet. */}
            {item.likes > 0 && (
              <>
                <span aria-hidden className="mx-1.5">·</span>
                <span className="inline-flex items-center gap-1">
                  <Heart aria-hidden className="h-3 w-3" strokeWidth={2.2} />
                  <span className="tabular">{item.likes}</span>
                  <span className="sr-only">
                    {item.likes === 1 ? 'reader said this helped them' : 'readers said this helped them'}
                  </span>
                </span>
              </>
            )}
          </p>
        </div>

        {/* The picture. A photograph where the teaching has one — its own
            listing crop, its poster, or a figure lifted out of the body,
            in that order — and the section's own field where it has
            none. See `bodyFigure` for why the widest figure is the one
            taken, and `TeachingArt` for why the field is not a blank. */}
        {/* 16:10 at every size, and that is not a coincidence: every
            landscape crop in `public/images/articles` is cut to 16:10, so
            a row shows the whole of the picture somebody framed rather
            than a taller slice with the ends taken off. */}
        <span
          className="relative aspect-[16/10] w-[7.5rem] shrink-0 overflow-hidden rounded-md bg-surface-2 sm:w-[9.5rem] xl:w-[12.5rem]"
          style={{ containerType: 'inline-size' }}
        >
          {item.thumbnail ? (
            <Image
              src={item.thumbnail.src}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 640px) 120px, (max-width: 1279px) 152px, 200px"
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
