/**
 * The search document shape and the pure functions over it.
 *
 * This module is deliberately free of any server-only import: the overlay
 * in the masthead is a client component, and pulling the index *builder*
 * in with the type would drag the filesystem-backed article store into the
 * browser bundle. The builder lives next door in search-index.ts.
 */

export interface SearchDoc {
  /** "Article", "Prophecy", "Teaching" — the pill on the result row. */
  kind: string
  title: string
  href: string
  /** "AUG 12, 2026" */
  date: string
  /** The section, the scripture, or the nation. */
  ref: string
  excerpt: string
  /** Lower-cased haystack. */
  text: string
}

const DATE = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** An ISO date as the design's dateline: "AUG 12, 2026". */
export function dateline(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  const [day, month, year] = DATE.format(parsed).split(' ')
  return `${month.toUpperCase()} ${day}, ${year}`
}

/**
 * How a search is actually matched.
 *
 * The whole site used to test one thing: does this lower-cased haystack
 * contain the query as a substring. That fails the two ways people
 * actually type. "colombia earthquake" finds nothing, because the words
 * are in that order nowhere; and a match in a body is worth exactly as
 * much as a match in a headline, so the right piece can land tenth.
 *
 * So: the query is split into terms, every term has to appear somewhere
 * (a search is an "and", not an "or"), and where it appears decides what
 * it is worth. A word in a title outranks a word in a body several times
 * over, a whole word beats a fragment, and a phrase typed in full beats
 * the same words scattered across a page.
 *
 * It is deliberately small — no stemming, no index, no library. The
 * archive is tens of documents, not thousands, and it is all in memory
 * already.
 */

export interface Field {
  text: string
  /** What a hit here is worth. Title 10, body 1. */
  weight: number
  /** Named when the caller wants to be told where the query landed. */
  name?: string
}

/** A score, and which fields carried it. */
export interface Match {
  score: number
  /** Field names that a query term landed in, best-scoring first. */
  matched: string[]
}

/**
 * Lower-cased and stripped of accents, so that a reader who types
 * "bogota" finds the conference at Bogotá. Nobody reaching for a phone
 * keyboard in a matatu is going to hold down the a.
 */
function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** The query, split into what a reader meant: words and numbers. */
export function terms(query: string): string[] {
  return fold(query)
    .split(/[^a-z0-9:]+/)
    .filter((term) => term.length > 1 || /\d/.test(term))
}

/**
 * What this candidate is worth for this query. Zero means it does not
 * match at all and should not be shown.
 */
export function score(query: string, fields: Field[]): number {
  return explain(query, fields).score
}

/**
 * The same match, with its reasoning kept.
 *
 * A reader looking at a results page can see for themselves why a piece
 * is there — the words are on the row. An agent calling the search API
 * cannot, so the API tells it: these are the fields the query landed in.
 * The scoring below is the single implementation; `score` is this with
 * the explanation dropped.
 */
export function explain(query: string, fields: Field[]): Match {
  const wanted = terms(query)
  if (wanted.length === 0) return { score: 1, matched: [] }

  const hay = fields.map((field) => ({
    text: fold(field.text),
    weight: field.weight,
    name: field.name,
  }))
  let total = 0
  /* Where terms landed, and how much each place was worth, so the best
     field can be named first rather than in declaration order. */
  const landed = new Map<string, number>()

  for (const term of wanted) {
    let best = 0
    let bestName: string | undefined
    for (const field of hay) {
      const at = field.text.indexOf(term)
      if (at === -1) continue
      /* "matt" inside "Matthew" counts; at the start of the word it
         counts for more, and as the whole word for more again. */
      const opensWord = at === 0 || !/[a-z0-9]/.test(field.text[at - 1] ?? '')
      const closesWord = !/[a-z0-9]/.test(field.text[at + term.length] ?? '')
      const shape = opensWord && closesWord ? 2 : opensWord ? 1.5 : 1
      const worth = field.weight * shape
      if (worth > best) {
        best = worth
        bestName = field.name
      }
    }
    /* Every term has to land somewhere. */
    if (best === 0) return { score: 0, matched: [] }
    if (bestName) landed.set(bestName, (landed.get(bestName) ?? 0) + best)
    total += best
  }

  /* Typed as a phrase and found as a phrase: worth more than the sum. */
  if (wanted.length > 1) {
    const phrase = fold(query.trim())
    for (const field of hay) {
      if (field.text.includes(phrase)) {
        total += field.weight * 3
        if (field.name) landed.set(field.name, (landed.get(field.name) ?? 0) + field.weight * 3)
        break
      }
    }
  }

  const matched = Array.from(landed.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)

  return { score: total, matched }
}

/** Sort by score, keeping the incoming order — newest first — for ties. */
export function byScore<T>(items: T[], scored: (item: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index, score: scored(item) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((row) => row.item)
}

/** The site-wide index, searched. An empty query returns everything. */
export function searchDocs(docs: SearchDoc[], query: string): SearchDoc[] {
  if (!query.trim()) return docs
  return byScore(docs, (doc) =>
    score(query, [
      { text: doc.title, weight: 10 },
      { text: doc.ref, weight: 6 },
      { text: doc.kind, weight: 5 },
      { text: doc.excerpt, weight: 4 },
      { text: doc.date, weight: 3 },
      { text: doc.text, weight: 1 },
    ])
  )
}

/** The content-type facets on the search page, counted. */
export function facetCounts(docs: SearchDoc[]): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const doc of docs) counts.set(doc.kind, (counts.get(doc.kind) ?? 0) + 1)
  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count
  )
}
