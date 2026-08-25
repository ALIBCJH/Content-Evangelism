import type { ArticleArt } from '@/lib/content'
import { shortRef } from '@/lib/short-ref'

/**
 * What a teaching shows when it has no photograph.
 *
 * Every listing on this site was a wall of headlines. The eye has
 * nothing to land on, so five teachings in a column read as one grey
 * block and a reader scans none of them — which is the whole reason a
 * news front page carries a thumbnail on every row.
 *
 * Photographs would be the obvious answer and are the wrong one here.
 * Five of the six teachings have none, and a ministry archive cannot
 * paper over that with stock: a generic open Bible under a teaching on
 * the unforgivable sin adds nothing and cheapens it.
 *
 * So the art is made of the teaching. `categoryArt` has named a palette
 * for every section since the site was built and nothing ever drew one;
 * this is that field, carrying the passage the teaching leads with. It
 * differs for every piece without anybody drawing anything, it is the
 * scripture plate's own language, and a reference is short enough to
 * read at the size a thumbnail actually is.
 *
 * A real photograph always wins — see `TeachingRow`. This is what stands
 * where there is none, not what stands instead of one.
 */
export function TeachingArt({
  art,
  cite,
  category,
  className = '',
}: {
  art: ArticleArt
  /** The reference the teaching opens on — "MARK 3:29". */
  cite?: string
  category: string
  className?: string
}) {
  /* The reference where there is one, the section where there is not.
     A teaching that opens on prose still gets a field of its own colour
     rather than a blank. */
  const mark = (shortRef(cite) ?? category).toUpperCase()

  return (
    <span
      aria-hidden
      className={`art-field art-${art.palette} flex items-center ${className}`}
    >
      <span className="art-rule" />
      <span
        /* Two lines at most and hidden past them: a reference that
           overflows its own field is worse than one that is cut, and
           `shortRef` has already done what it can to make neither
           happen. */
        className="relative line-clamp-2 px-[9%] font-apparatus font-bold uppercase leading-[1.2] tracking-[0.06em] [overflow-wrap:anywhere]"
        style={{ fontSize: 'clamp(0.5625rem, 8.5cqw, 1.25rem)' }}
      >
        {mark}
      </span>
    </span>
  )
}
