import { parseBody } from '@/lib/article-body'
import { scriptureRefs } from '@/lib/scripture'
import { dateline } from '@/lib/search-docs'
import type { RealRow } from '@/lib/rows'
import type { ArticleArt } from '@/lib/content'
import type { Category } from '@/lib/content'

/**
 * What the archive needs to draw a piece — and nothing else.
 *
 * The listing is interactive now: a reader filters it, sorts it, and
 * marks pieces to come back to, all of which happen in the browser. That
 * means the rows cross to the client, and a row carries the entire body
 * of a teaching — sixty kilobytes of Scripture the listing never prints.
 *
 * So the body is read here, on the server, and what crosses is the four
 * things drawn from it: the opening line, the references, the passage the
 * piece leads with, and a lowercase haystack for the filter.
 */
export interface ArchiveItem {
  slug: string
  href: string
  title: string
  dek: string
  category: Category
  authorName: string
  publishedAt: string
  /** "AUG 17, 2026" — formatted once, so every card agrees. */
  dated: string
  readMinutes: number
  excerpt: string
  refs: string[]
  /** How many more references the piece carries than the chips show. */
  moreRefs: number
  /** The piece's own picture, where it has one — shown at the head. */
  image?: { src: string; alt: string }
  /**
   * What a listing row shows: the landscape crop where the teaching has
   * one, the poster where it does not, and absent where it has neither —
   * in which case the row draws the section's own field instead.
   */
  thumbnail?: { src: string; alt: string }
  /**
   * The passage the teaching leads with, set on the plate at the head of
   * the lead card. Absent on a piece that opens on prose rather than on
   * Scripture, and the plate is absent with it.
   */
  quote?: { text: string; cite?: string }
  /**
   * The section's palette and mark, from `categoryArt`. Carried so a
   * listing can draw a teaching that has no photograph — see
   * `TeachingArt`.
   */
  art: ArticleArt
  /** Lowercased title, standfirst, opening line and references. */
  haystack: string
  /**
   * How many times the piece has been opened, from the site's own
   * counters. Zero where nothing has been counted yet — a deployment
   * with no store attached, or a piece published this morning.
   */
  views: number
}

/**
 * The opening line of a piece — what a reader sees in the listing.
 *
 * Read through the body parser rather than off the raw text, so what the
 * card shows is words. Splitting on blank lines handed the listing
 * whatever markup the paragraph opened with, and a card reading
 * "**Ministry of Repentance and Holiness**" is the listing showing a
 * reader the machinery.
 */
export function openingLine(body: string | undefined, dek: string): string {
  if (!body) return dek
  const paragraph = parseBody(body).find((block) => block.kind === 'paragraph')
  if (!paragraph || paragraph.kind !== 'paragraph') return dek
  const text = paragraph.inlines
    .map((inline) => inline.text)
    .join('')
    .trim()
  return text || dek
}

/**
 * The first Scripture the teaching sets as a figure.
 *
 * A long passage is cut at a word, because the plate is the head of a
 * card and not a lectern: the verse is there to say what ground the piece
 * stands on, and a reader who wants the whole of it is one scroll from
 * it — the teaching itself is directly underneath.
 */
const QUOTE_MAX = 150

export function leadQuote(body: string | undefined): { text: string; cite?: string } | undefined {
  if (!body) return undefined
  const quote = parseBody(body).find((block) => block.kind === 'quote')
  if (!quote || quote.kind !== 'quote') return undefined

  const full = quote.inlines.map((inline) => inline.text).join('').trim()
  if (!full) return undefined
  if (full.length <= QUOTE_MAX) return { text: full, ...(quote.cite ? { cite: quote.cite } : {}) }

  const cut = full.slice(0, QUOTE_MAX)
  const text = `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '')} …`
  return { text, ...(quote.cite ? { cite: quote.cite } : {}) }
}

const CHIPPED = 3

export function toArchiveItems(
  rows: RealRow[],
  /** Views by path, from the insight counters. */
  views: Record<string, number> = {}
): ArchiveItem[] {
  return rows.map((row) => {
    /* Uncapped: this is a count, and a cap would make every teaching
       carry the same one. */
    const all = scriptureRefs(row.body, 200)
    const refs = all.slice(0, CHIPPED)
    const excerpt = openingLine(row.body, row.dek)
    return {
      slug: row.slug,
      href: row.href,
      title: row.title,
      dek: row.dek,
      category: row.category,
      authorName: row.authorName,
      art: row.art,
      publishedAt: row.publishedAt,
      dated: dateline(row.publishedAt),
      readMinutes: row.readMinutes,
      excerpt,
      refs,
      moreRefs: Math.max(0, all.length - refs.length),
      ...(row.imageUrl
        ? { image: { src: row.imageUrl, alt: row.imageAlt ?? '' } }
        : {}),
      /* The listing's own picture, where the teaching carries one. It
         falls back to the poster rather than to nothing, because a
         cropped poster is still better than an empty box — but see
         PostedArticle.thumbnailUrl for why a crop is the worse of the
         two on this ministry's artwork. */
      ...(row.thumbnailUrl || row.imageUrl
        ? { thumbnail: { src: (row.thumbnailUrl ?? row.imageUrl)!, alt: row.imageAlt ?? '' } }
        : {}),
      quote: leadQuote(row.body),
      haystack: `${row.title}\n${row.dek}\n${excerpt}\n${all.join(' ')}\n${row.category}`.toLowerCase(),
      views: views[row.href] ?? 0,
    }
  })
}
