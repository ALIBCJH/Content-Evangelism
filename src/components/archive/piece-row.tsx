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
 * ## The same row, run as the lead
 *
 * One row on the front page is drawn large from `xl`: the picture above
 * the headline at the full width of its column, with the standfirst
 * under it. It is the same component and the same markup — the lead is a
 * set of `xl:` classes on this row, not a second component and not a
 * second copy of the row in the page.
 *
 * That is worth being deliberate about. The obvious way to add a lead is
 * to render a `LeadCard` beside the listing and hide whichever of the two
 * does not apply, and it is the wrong way twice over: a browser fetches
 * the picture inside a `display:none` box, so every phone on the site
 * would pay in bandwidth for a lead it is never shown, and the same
 * teaching would sit in the page twice for anything reading the markup
 * rather than looking at it.
 *
 * What a phone does pay here is exact and small: one `grid-row` property
 * that means nothing outside a grid, and the lead's standfirst, which is
 * two sentences already being sent for the search to score. No second
 * picture, no second row, and no phone-width class touched.
 */
export function PieceRow({
  item,
  priority = false,
  lead = false,
  beside = 0,
}: {
  item: ArchiveItem
  priority?: boolean
  /**
   * Draw this row as the front page's lead — from `xl` only, and only
   * where the picture is big enough to stand it. `canLead` decides;
   * nothing here checks.
   */
  lead?: boolean
  /**
   * How many rows stand in the second column beside the lead, which is
   * how many grid rows the lead has to span to sit against all of them.
   * Ignored on every row but the lead, and inert at every width where
   * the listing is not a grid.
   */
  beside?: number
}) {
  return (
    /* Where the row sits at `xl`, which is the whole of the two-column
       front. The lead is pinned to the first column and spans it; every
       other row is put in the second. Below `xl` neither class applies
       and the rows are the single column they have always been.

       Flat, rather than a wrapper round the lead and another round the
       rest: the rows stay siblings, so `last:border-b-0` still finds the
       last row of the page instead of the last row of a wrapper. */
    <article
      className={`group relative border-b border-rule py-5 last:border-b-0 ${
        lead
          ? 'xl:sticky xl:top-24 xl:col-start-1 xl:self-start xl:border-b-0 xl:pb-0 xl:pt-0'
          : 'xl:col-start-2'
      }`}
      /* The lead's grid area, counted rather than guessed. It has to
         start at the first row and end after the last one in the column
         beside it: given a span shorter than that the rows below it have
         nowhere to go, and given a longer one the browser stretches the
         rows it does not reach — which drew a five-hundred-pixel hole
         under the first headline the first time this was tried with a
         round number.

         Inline because the number is only known at render, and harmless
         inline because `grid-row` means nothing to an element that is
         not in a grid: below `xl` this listing is a plain column and the
         property is never consulted. */
      style={lead && beside > 0 ? { gridRow: `1 / span ${beside}` } : undefined}
    >
      <div
        className={`flex items-start justify-between gap-4 sm:gap-6 ${
          /* Picture over headline, which is the order a front page uses
             and the opposite of the order a row uses. A row is scanned,
             so the headline comes first and the picture is what the eye
             reaches only once a headline has stopped it. A lead is not
             scanned — it is the one thing on the page asking to be
             looked at, and the picture is what does the asking. */
          lead ? 'xl:flex-col-reverse xl:gap-0' : ''
        }`}
      >
        <div className={`min-w-0 flex-1 ${lead ? 'xl:mt-5 xl:w-full xl:flex-none' : ''}`}>
          {/* No section label. It stood here as a gold kicker and said
              "Teachings" on eight of fourteen rows, which is a word that
              distinguishes nothing while taking the line above every
              headline — and the two places a reader can act on a section
              are the topics rail and the topic pages, both of which are
              still there. */}
          <h3
            className={`text-pretty font-apparatus text-[1.0625rem] font-bold leading-[1.3] tracking-[-0.011em] text-navy sm:text-[1.125rem] ${
              lead ? 'xl:text-[1.75rem] xl:leading-[1.15] xl:tracking-[-0.02em]' : ''
            }`}
          >
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
          {/* The standfirst, on the lead and nowhere else. It is two
              sentences saying what the teaching answers, and it is the
              difference between a big picture with a headline on it and
              something a reader can decide about — but it is also four
              lines, which is why no row carries one. Already on every
              item for the search to score, so drawing it here costs the
              page nothing it was not already sending. */}
          {lead && item.dek && (
            <p className="mt-3 hidden font-reading text-[1.0625rem] leading-[1.6] text-ink-muted xl:block">
              {item.dek}
            </p>
          )}

          <p className={`kicker leading-[1.5] text-ink-subtle ${lead ? 'mt-2 xl:mt-4' : 'mt-2'}`}>
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
        {/* 16:10 at both sizes, and that is not a coincidence: every
            landscape crop in `public/images/articles` is cut to 16:10, so
            the lead shows the whole of the picture somebody framed rather
            than a taller slice of it with the ends taken off. */}
        <span
          className={`relative aspect-[16/10] w-[7.5rem] shrink-0 overflow-hidden rounded-md bg-surface-2 sm:w-[9.5rem] ${
            lead ? 'xl:w-full xl:rounded-lg' : ''
          }`}
          style={{ containerType: 'inline-size' }}
        >
          {item.thumbnail ? (
            <Image
              src={item.thumbnail.src}
              alt=""
              fill
              priority={priority}
              sizes={
                lead
                  ? '(max-width: 640px) 120px, (max-width: 1279px) 152px, 33vw'
                  : '(max-width: 640px) 120px, 152px'
              }
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
