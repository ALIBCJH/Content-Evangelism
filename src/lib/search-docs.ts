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

/** Substring match over the haystack; an empty query returns everything. */
export function searchDocs(docs: SearchDoc[], query: string): SearchDoc[] {
  const q = query.trim().toLowerCase()
  if (!q) return docs
  return docs.filter((doc) => doc.text.includes(q) || doc.title.toLowerCase().includes(q))
}

/** The content-type facets on the search page, counted. */
export function facetCounts(docs: SearchDoc[]): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const doc of docs) counts.set(doc.kind, (counts.get(doc.kind) ?? 0) + 1)
  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count
  )
}
