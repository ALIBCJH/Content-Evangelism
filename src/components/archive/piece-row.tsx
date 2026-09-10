import Link from 'next/link'
import Image, { getImageProps } from 'next/image'
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
 * ## Picture on top, at every width
 *
 * It was a row from `sm` up — headline on the left, a 200-pixel picture
 * on the right — and a card only on a phone. It is a card everywhere
 * now: picture, headline, the opening, the facts. On a phone one card is
 * the width of the screen; from `sm` the cards stand two across, in the
 * grid `archive-list` lays them out in.
 *
 * Two across and not one, and that was measured rather than chosen.
 * One column of picture-on-top cards at 1440 is 641 pixels a card, 1.4
 * teachings a screen and a listing 8,300 pixels long — and it cannot be
 * sharp, because a 786-pixel picture on a retina screen wants 1,572 of
 * source and the largest crop here is 1,468. Two across is 386 pixels a
 * card and 4.7 teachings a screen, which is exactly what the row gave,
 * and every picture clears twice its box.
 *
 * What made it possible is the pictures. When this was a row, most of
 * the archive had a generated colour field and no photograph, and a grid
 * of colour fields reads as an empty page. Every teaching has artwork
 * now, and a desktop version drawn for this size — see `Thumbnail`.
 *
 * `canLead` and `pickLead` are left where they are, unused. They cost
 * nothing, they are covered, and the archive may well want a lead again
 * on a page that is not this one.
 */
export function PieceRow({ item, priority = false }: { item: ArchiveItem; priority?: boolean }) {
  return (
    <article className="group relative border-b border-rule py-6 last:border-b-0 sm:border-b-0 sm:py-0">
      {/* A card at every width: the picture on top, the words under it.
          The rule between cards is a phone's — in the grid the gap does
          that job, and a rule under each of two cards side by side draws
          two half-lines that do not meet. */}
      <div className="flex flex-col gap-3.5 sm:gap-4">
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
          <h3 className="text-pretty font-article text-[1.3125rem] font-extrabold leading-[1.25] tracking-[-0.008em] text-navy xl:text-[1.375rem] xl:leading-[1.24] xl:tracking-[-0.01em]">
            <Link href={item.href} data-track="read-article" className="focus-ring">
              {/* The whole row follows the headline, so the small print
                  under it is not a second link to the same place.

                  ## Two things this had wrong, both invisible in the markup

                  `z-10`, because the picture was on top of it. Both are
                  positioned, and the picture comes later in the document
                  — it is only *visually* first, by `order-first` — so it
                  painted over this and swallowed every press. On a phone
                  that is 244 pixels of a 415-pixel card: more than half
                  the thing, and the half a thumb goes for. Measured on
                  the live site, a tap on the picture landed on the `img`
                  and did nothing at all.

                  `-inset-x-5`, because the picture bleeds to both edges
                  of the screen and this did not follow it. The twenty
                  pixels either side were picture that was not a link.
                  Both come back to nothing at `sm`, where the picture is
                  a thumbnail inside the margin again. */}
              <span
                aria-hidden
                className="absolute -inset-x-5 inset-y-0 z-10 transition-colors active:bg-navy/[0.045] sm:inset-x-0"
              />
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
            stay on the measure. From `sm` the margin comes back, the
            corners round, and the picture is the width of its card.

            `order-first` rather than reordering the markup, so the
            headline stays the first thing in the document — the picture
            is `alt=""` and a screen reader passes straight over it. */}
        <span
          className="relative -mx-5 order-first block aspect-[16/10] overflow-hidden bg-surface-2 sm:mx-0 sm:rounded-md"
          style={{ containerType: 'inline-size' }}
        >
          {item.thumbnail ? (
            <Thumbnail thumbnail={item.thumbnail} priority={priority} />
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

/** The widths the card's picture is drawn at, per the card's own classes. */
/* A card's width, per the grid it stands in — measured, not estimated:
   the full screen on a phone, half the column from `sm` (about half the
   screen until `lg` takes a sidebar), then 313, 377 and 503 pixels at
   1280, 1440 and 1920. Rounded up, because a picture fetched a little
   large is sharp and one fetched a little small is not. */
const PHONE = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1535px) 390px, 520px'
const DESKTOP = '(max-width: 1023px) 50vw, (max-width: 1535px) 390px, 520px'

/**
 * The card's picture — the phone's, or the desktop's where one was made.
 *
 * Art direction, not two pictures: a `<picture>` with a `<source>` for
 * wide screens, so the browser fetches exactly one file and it is the
 * right one. Two `<Image>`s shown and hidden by CSS would download both on
 * every screen, which on the mobile data most of these readers are on is
 * the thing this site has spent the most care avoiding.
 *
 * `getImageProps` is Next's way of doing this: it produces the same
 * srcset and sizes an `<Image>` would, without rendering one, so both
 * files still go through the optimiser and still come in at the width the
 * box needs.
 *
 * With no desktop file the card is exactly what it was — the same
 * `<Image>`, the same markup — so nothing changes until a desktop picture
 * is actually supplied.
 */
function Thumbnail({
  thumbnail,
  priority,
}: {
  thumbnail: NonNullable<ArchiveItem['thumbnail']>
  priority: boolean
}) {
  if (!thumbnail.desktop) {
    return (
      <Image src={thumbnail.src} alt="" fill priority={priority} sizes={PHONE} className="object-cover" />
    )
  }

  const desktop = getImageProps({
    src: thumbnail.desktop.src,
    alt: '',
    fill: true,
    sizes: DESKTOP,
  }).props
  const phone = getImageProps({
    src: thumbnail.src,
    alt: '',
    fill: true,
    priority,
    sizes: PHONE,
  }).props

  return (
    <picture>
      {/* From `sm`, which is where the card stops being a phone card and
          becomes a row with the picture at the side. */}
      <source media="(min-width: 640px)" srcSet={desktop.srcSet} sizes={desktop.sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img {...phone} className="object-cover" />
    </picture>
  )
}
