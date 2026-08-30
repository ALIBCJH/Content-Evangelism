import { parseBody, type Block } from '@/lib/article-body'
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

/**
 * The picture a listing row shows when the teaching was never given a
 * poster of its own — taken out of the writing itself.
 *
 * Two of the fourteen teachings on this site have artwork attached. The
 * rest were written before anybody was attaching any, and one of them
 * carries photographs inside the body that no listing has ever shown: a
 * row of women in the dress-code teaching, sitting three screens down a
 * page nobody has opened yet, while the row that would make them open it
 * drew a coloured field instead.
 *
 * So a body figure is the third thing tried, after the listing crop and
 * the poster. It is the teaching's own picture either way; the only
 * difference is that nobody has cropped this one for a thumbnail.
 *
 * Which is why the widest is taken rather than the first. A listing row
 * is 16:10 and `object-cover` fills it by cutting whatever does not fit,
 * so a 526x701 portrait loses its top and bottom — a face, usually —
 * while a 1635x962 landscape loses almost nothing. The dress-code
 * teaching carries exactly that pair, in exactly that order, and taking
 * the first would have taken the wrong one. A figure that declares no
 * dimensions is treated as square: better than a portrait, worse than a
 * known landscape.
 */
type Figure = Extract<Block, { kind: 'figure' }>

export function bodyFigure(body: string | undefined): { src: string; alt: string } | undefined {
  if (!body) return undefined
  const figures = parseBody(body).filter((block): block is Figure => block.kind === 'figure')
  if (figures.length === 0) return undefined

  const widest = figures.reduce((best, figure) => {
    const ratio = (f: Figure) => (f.width && f.height ? f.width / f.height : 1)
    return ratio(figure) > ratio(best) ? figure : best
  })
  return { src: widest.src, alt: widest.alt }
}

/**
 * The palette a teaching's field is drawn in when it has no picture.
 *
 * `categoryArt` gives one palette per section, which is the right answer
 * for a badge and the wrong one for a column: eight of this archive's
 * fourteen teachings are filed under Teachings, so a listing drawn from
 * the section alone is eight identical olive bands stacked on top of each
 * other — which is the exact objection that took pictures out of this
 * listing the last time, and it was a fair one.
 *
 * The section is already written in words directly above the headline, so
 * the colour is not needed to carry it and is free to do the other job:
 * telling one row from the next. Keyed on the slug, so a teaching's field
 * is the same colour every time anybody loads the page, and stable across
 * a rebuild.
 */
const PALETTES = ['dawn', 'flame', 'olive', 'wine', 'orchid', 'midnight', 'harvest'] as const

export function paletteFor(slug: string): ArticleArt['palette'] {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  return PALETTES[hash % PALETTES.length]
}

/**
 * The same items, with no two fields in a row drawn in the same colour.
 *
 * `paletteFor` keys the colour to the slug, which keeps a teaching the
 * same colour wherever it appears — but seven palettes over eleven
 * pieces without artwork means collisions are certain, and the only
 * collision a reader can actually see is two of them touching. On the
 * front page as it stands the first two rows both came out orchid, which
 * reads as a mistake rather than as a scheme.
 *
 * So the hash decides, and this only steps in where the hash has put two
 * of the same colour next to each other: the second one rotates to the
 * next palette that is not its neighbour's. Rows with a photograph are
 * skipped and do not break a run — what matters is consecutive *fields*,
 * since a picture between two olive fields already separates them.
 *
 * The cost is that filtering the archive can change a field's colour, by
 * changing which pieces are adjacent. That is the right way round: the
 * colour is here to tell one row from the next, which is a fact about the
 * column, and nobody is memorising it.
 */
export function spreadFields(items: ArchiveItem[]): ArchiveItem[] {
  let previous: string | null = null
  return items.map((item) => {
    if (item.thumbnail) return item
    let palette = item.art.palette
    if (palette === previous) {
      const at = PALETTES.indexOf(palette as (typeof PALETTES)[number])
      palette = PALETTES[(at + 1) % PALETTES.length]
    }
    previous = palette
    return palette === item.art.palette ? item : { ...item, art: { ...item.art, palette } }
  })
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
      /* The section's own art, with the palette re-keyed to the piece —
         see `paletteFor`. The icon is untouched; nothing draws it. */
      art: { ...row.art, palette: paletteFor(row.slug) },
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
      ...(() => {
        const attached =
          row.thumbnailUrl || row.imageUrl
            ? { src: (row.thumbnailUrl ?? row.imageUrl)!, alt: row.imageAlt ?? '' }
            : undefined
        const thumbnail = attached ?? bodyFigure(row.body)
        return thumbnail ? { thumbnail } : {}
      })(),
      quote: leadQuote(row.body),
      haystack: `${row.title}\n${row.dek}\n${excerpt}\n${all.join(' ')}\n${row.category}`.toLowerCase(),
      views: views[row.href] ?? 0,
    }
  })
}
