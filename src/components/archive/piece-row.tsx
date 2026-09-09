import Link from 'next/link'
import Image from 'next/image'
import { Heart, Share2 } from 'lucide-react'
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
    <article className="group relative border-b border-rule py-6 last:border-b-0 sm:py-5 xl:py-7">
      {/* A card on a phone, a row from `sm` up. See the note on the
          picture below for why the shape changes at all. */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 xl:gap-10">
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
          <h3 className="text-pretty font-article text-[1.3125rem] font-extrabold leading-[1.25] tracking-[-0.008em] text-navy xl:text-[1.5rem] xl:leading-[1.22] xl:tracking-[-0.012em]">
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
          {/* The teaching's own opening, clamped to two lines.

              This was the standfirst, and only from `xl`. Two changes,
              and they are the same change: a reader deciding whether to
              open something wants a taste of the thing, not a summary of
              it — and they want it on the screen they are actually
              holding.

              The opening is the better taste because of how these are
              written. Every headline here is a question and the first
              paragraph is the answer to it, so the two lines under the
              headline are the beginning of the answer, breaking off
              exactly where a reader has to open the teaching to get the
              rest. A standfirst says what the piece is about; this is
              the piece. See `openingLine`.

              Two lines, because the opening runs to five or six and six
              lines under every headline in a ten-row column is a page of
              openings with headlines in it. */}
          {item.excerpt && (
            <p className="mt-2 font-reading text-[0.9375rem] leading-[1.55] text-ink-700 line-clamp-2 xl:mt-2.5 xl:text-[1rem]">
              {item.excerpt}
            </p>
          )}

          <p className="kicker mt-2 flex flex-wrap items-center leading-[1.5] text-ink-500 xl:mt-3.5">
            <Posted iso={item.publishedAt} dated={item.dated} />
            <span aria-hidden className="mx-1.5">·</span>
            <span className="tabular">{item.readMinutes}</span>&nbsp;min
            {/* What readers have done with it, on the same line as what
                it costs them — a heart and a share are facts about the
                teaching of the same kind as how long it takes to read.

                The marks are always drawn and the numbers are not. A
                teaching nobody has answered for yet shows the two marks
                and no figures, which says "this can be answered for";
                printing a nought instead would say "it was offered and
                refused", and that is a different and untrue thing. */}
            <span aria-hidden className="mx-1.5">·</span>
            <span className="inline-flex items-center gap-1">
              <Heart aria-hidden className="h-3 w-3" strokeWidth={2.2} />
              {item.likes > 0 && <span className="tabular">{item.likes}</span>}
              <span className="sr-only">
                {item.likes === 0
                  ? 'No reader has said yet whether this helped them'
                  : item.likes === 1
                    ? '1 reader said this helped them'
                    : `${item.likes} readers said this helped them`}
              </span>
            </span>
            <span className="ml-2.5 inline-flex items-center gap-1">
              <Share2 aria-hidden className="h-3 w-3" strokeWidth={2.2} />
              {item.shares > 0 && <span className="tabular">{item.shares}</span>}
              <span className="sr-only">
                {item.shares === 0 ? 'Not shared yet' : `Shared ${item.shares} times`}
              </span>
            </span>
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
            than a taller slice with the ends taken off.

            ## Full width on a phone, and above the headline

            A 120px thumbnail beside a headline is the right answer on a
            screen with two columns of room. On a phone it is a stamp:
            too small to be seen, and it takes a fifth of the only line
            the headline has. The picture goes to the top and runs the
            whole width of the display, which is what a phone is — one
            column, held close, scrolled with a thumb.

            `-mx-5` is the shell's own margin at this width, cancelled:
            the picture reaches both edges of the screen while the words
            stay on the measure. From `sm` the margin comes back and the
            row is exactly what it was.

            `order-first` rather than reordering the markup, so the
            headline stays the first thing in the document — the picture
            is `alt=""` and a screen reader passes straight over it. */}
        <span
          className="relative -mx-5 order-first block aspect-[16/10] shrink-0 overflow-hidden bg-surface-2 sm:mx-0 sm:order-none sm:w-[9.5rem] sm:rounded-md xl:w-[12.5rem]"
          style={{ containerType: 'inline-size' }}
        >
          {item.thumbnail ? (
            <Image
              src={item.thumbnail.src}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 639px) 100vw, (max-width: 1279px) 152px, 200px"
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
