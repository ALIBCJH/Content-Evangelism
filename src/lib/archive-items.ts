import { parseBody } from '@/lib/article-body'
import { scriptureRefs } from '@/lib/scripture'
import { dateline } from '@/lib/search-docs'
import type { RealRow } from '@/lib/rows'
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
  /** The passage the teaching leads with, set on the plate beside it. */
  quote?: { text: string; cite?: string }
  /** Lowercased title, standfirst, opening line and references. */
  haystack: string
}

/** The opening line of a piece — what a reader sees in the listing. */
export function openingLine(body: string | undefined, dek: string): string {
  if (!body) return dek
  const first = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('## ') && !block.startsWith('> '))
  return first ?? dek
}

/**
 * The first Scripture the teaching sets as a figure.
 *
 * A long passage is cut at a word, because the plate is a card and not a
 * lectern: the quote is there to say what ground the piece stands on, and
 * a reader who wants the whole verse is one click from it.
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

export function toArchiveItems(rows: RealRow[]): ArchiveItem[] {
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
      publishedAt: row.publishedAt,
      dated: dateline(row.publishedAt),
      readMinutes: row.readMinutes,
      excerpt,
      refs,
      moreRefs: Math.max(0, all.length - refs.length),
      quote: leadQuote(row.body),
      haystack: `${row.title}\n${row.dek}\n${excerpt}\n${all.join(' ')}\n${row.category}`.toLowerCase(),
    }
  })
}
