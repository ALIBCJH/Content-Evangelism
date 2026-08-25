import type { Block } from '@/lib/article-body'

/**
 * Which passages in a teaching are set on the plate.
 *
 * A teaching here runs eight to eleven minutes, and on a phone that is a
 * long way to travel through one column of body serif. The pieces are
 * better broken up than they look — headings every few paragraphs,
 * callouts, a video here and there — but the longest stretches still run
 * six and seven paragraphs with nothing to rest the eye on, and the
 * reading gets heavy well before it gets difficult.
 *
 * The site already owns the answer. The lead card on the front page sets
 * its opening passage on a navy plate ruled in gold, and it is the one
 * thing on that page nobody scrolls past. Inside a teaching the same
 * passages are set as ordinary indented quotes. Promoting some of them
 * gives the scroll a shape — prose, prose, a dark field of Scripture,
 * prose again — and it does it with the design language already here and
 * with the words the teaching is standing on rather than with an
 * ornament.
 *
 * Some, not all. A plate under every quotation is the wallpaper it was
 * meant to interrupt.
 */

/**
 * How many paragraphs must pass before a passage is worth resting on.
 *
 * Not a run of prose immediately before the quote, which is what this
 * first measured: quotations here rarely sit at the end of a long
 * stretch, so that rule fired almost never on some pieces and five times
 * on others. Distance since the *last plate* is the thing that actually
 * governs rhythm, and it gives about one plate every three to five
 * minutes across the archive, with pieces that quote sparingly simply
 * getting fewer — the rule cannot invent Scripture that is not there.
 */
export const PARAGRAPHS_BETWEEN_PLATES = 6

/**
 * The indices of the quote blocks to set on the plate.
 *
 * Counting starts at the top of the piece, so the first plate needs the
 * same run of reading behind it as any other and a teaching never opens
 * on one — it has a headline, a standfirst and often a picture already,
 * and a plate among them is a fourth thing shouting at somebody who has
 * not started reading yet.
 */
export function platedQuotes(blocks: Block[]): Set<number> {
  const plated = new Set<number>()
  let since = 0

  blocks.forEach((block, index) => {
    if (block.kind === 'paragraph') {
      since += 1
      return
    }
    if (block.kind === 'quote' && since >= PARAGRAPHS_BETWEEN_PLATES) {
      plated.add(index)
      since = 0
    }
    /* Every other block — a heading, a callout, a video, a quotation too
       close to the last plate — is left to pass without resetting the
       count. They are smaller breaks than a plate, and a reader who has
       come through six paragraphs and three headings has still come a
       long way; zeroing the distance on each of them would push the next
       plate out past the point it was wanted. */
  })

  return plated
}
