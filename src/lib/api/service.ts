import { CATEGORIES, authorHref, categoryBlurb, categorySlug, siteUrl, topicHref, type Author, type Category } from '@/lib/content'
import { authorOfPiece } from '@/lib/authors'
import { prophecyRecords, recordHref, type ProphecyRecord } from '@/lib/prophecies'
import { listRealRows, relatedRows, type RealRow } from '@/lib/rows'
import { explain } from '@/lib/search-docs'
import { teachingHref, teachingRecordings, type TeachingRecording } from '@/lib/teachings'
import type { CollectionParams } from '@/lib/api/params'

/**
 * The application service the API is built on.
 *
 * Everything here reads through the same modules the website reads
 * through — `listRealRows` for the writing, `prophecyRecords` for the
 * record, `teachingRecordings` for the recordings, `explain` for matching.
 * Nothing in this file talks to a store, and nothing in it re-implements
 * a rule the pages already apply. If an article stops appearing on the
 * site it stops appearing here, in the same deploy, without anybody
 * remembering to change two places.
 *
 * A future MCP server, were one ever justified, calls these functions.
 * It does not call the store, and it does not call the HTTP API.
 */

/**
 * Anything dated after this instant is not published yet.
 *
 * The desk has no draft state — a piece is in the store or it is not — so
 * this is the only publication boundary the model actually has, and the
 * API enforces it rather than trusting that nobody ever post-dates a
 * piece to hold it back.
 */
export function isPublished(row: Pick<RealRow, 'publishedAt'>, now = new Date()): boolean {
  const at = new Date(row.publishedAt)
  return Number.isNaN(at.getTime()) || at <= now
}

export async function publishedArticles(): Promise<RealRow[]> {
  const rows = await listRealRows()
  return rows.filter((row) => isPublished(row))
}

/** The filters every article collection understands, applied in one place. */
export function filterArticles(rows: RealRow[], params: CollectionParams): RealRow[] {
  return rows.filter((row) => {
    if (params.category && row.category !== params.category) return false
    if (params.tag && !row.tags.includes(params.tag)) return false
    if (params.author && row.authorName.toLowerCase() !== params.author.toLowerCase()) return false
    /* Dates compare as ISO strings: publishedAt starts with the calendar
       date, so "2026-08-20" >= "2026-08-01" without parsing either. */
    if (params.from && row.publishedAt.slice(0, 10) < params.from) return false
    if (params.to && row.publishedAt.slice(0, 10) > params.to) return false
    return true
  })
}

export async function getArticle(slug: string): Promise<{ row: RealRow; related: RealRow[] } | null> {
  const rows = await publishedArticles()
  const row = rows.find((candidate) => candidate.slug === slug)
  if (!row) return null
  return { row, related: relatedRows(rows, row.slug, row.category) }
}

export function getProphecy(id: string): ProphecyRecord | undefined {
  return prophecyRecords.find((record) => record.id === id)
}

export function getTeaching(id: string): TeachingRecording | undefined {
  return teachingRecordings.find((recording) => recording.id === id)
}

/* ── Taxonomies ──────────────────────────────────────────────────── */

/**
 * The categories that actually hold something, counted.
 *
 * A category with nothing filed under it is not offered: the site does not
 * publish its landing page either, and an agent that filtered on it would
 * be handed an empty collection for a section that does not really exist.
 */
export function categoriesWithCounts(rows: RealRow[]) {
  return CATEGORIES.map((name: Category) => ({
    name,
    slug: categorySlug(name),
    description: categoryBlurb[name],
    articleCount: rows.filter((row) => row.category === name).length,
    url: `${siteUrl}${topicHref(name)}`,
  })).filter((category) => category.articleCount > 0)
}

/** Every tag in use, most-used first, then alphabetically. */
export function tagsWithCounts(rows: RealRow[]) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    for (const tag of row.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return Array.from(counts, ([tag, articleCount]) => ({ tag, articleCount }))
    .sort((a, b) => b.articleCount - a.articleCount || a.tag.localeCompare(b.tag))
}

/**
 * Bylines that have published, with a profile when the site holds one.
 *
 * Counted per person rather than per spelling. The key is the writer's
 * id where a piece carries one and the byline where it does not, so two
 * writers who share a name are two entries, and one writer's pieces do
 * not split into two entries because an older one predates their id.
 */
export function authorsWithCounts(rows: RealRow[], directory: Author[]) {
  const counts = new Map<string, { name: string; author?: Author; articleCount: number }>()
  for (const row of rows) {
    const author = authorOfPiece(directory, row)
    const key = author?.id ?? `name:${row.authorName}`
    const held = counts.get(key)
    if (held) held.articleCount += 1
    else counts.set(key, { name: author?.name ?? row.authorName, author, articleCount: 1 })
  }
  return Array.from(counts.values(), ({ name, author, articleCount }) => {
    return {
      name,
      articleCount,
      ...(author
        ? {
            id: author.id,
            ...(author.role ? { role: author.role } : {}),
            url: `${siteUrl}${authorHref(author)}`,
          }
        : {}),
    }
  }).sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name))
}

/* ── Search ──────────────────────────────────────────────────────── */

export type SearchKind = 'article' | 'prophecy-record' | 'teaching-recording'

export interface SearchHit {
  kind: SearchKind
  /** The scored item, for the caller to shape. */
  article?: RealRow
  record?: ProphecyRecord
  recording?: TeachingRecording
  score: number
  matchedFields: string[]
}

/**
 * One search across everything the archive holds.
 *
 * The reader's search box searches the writing, the prophetic record and
 * the recordings together, because a question does not know which of the
 * three answers it. An agent asking "did the ministry speak about
 * Colombia" is in exactly that position, so the API searches the same
 * three and says which kind each answer is.
 *
 * The field weights are the site's own, and the fields are named, so a
 * result can report where the query landed rather than only how well.
 */
export function searchAll(
  rows: RealRow[],
  query: string,
  kinds: SearchKind[] = ['article', 'prophecy-record', 'teaching-recording']
): SearchHit[] {
  const hits: SearchHit[] = []

  if (kinds.includes('article')) {
    for (const row of rows) {
      const { score, matched } = explain(query, [
        { text: row.title, weight: 10, name: 'title' },
        { text: row.tags.join(' '), weight: 7, name: 'tags' },
        { text: row.category, weight: 6, name: 'category' },
        { text: row.dek, weight: 4, name: 'summary' },
        { text: row.authorName, weight: 3, name: 'author' },
        { text: row.text, weight: 1, name: 'content' },
      ])
      if (score > 0) hits.push({ kind: 'article', article: row, score, matchedFields: matched })
    }
  }

  if (kinds.includes('prophecy-record')) {
    for (const record of prophecyRecords) {
      const { score, matched } = explain(query, [
        { text: record.title, weight: 10, name: 'title' },
        { text: record.tags.join(' '), weight: 7, name: 'tags' },
        { text: `${record.location} ${record.subject}`, weight: 6, name: 'location' },
        { text: record.summary, weight: 4, name: 'summary' },
        { text: `${record.rid} ${record.date}`, weight: 2, name: 'record' },
      ])
      if (score > 0) hits.push({ kind: 'prophecy-record', record, score, matchedFields: matched })
    }
  }

  if (kinds.includes('teaching-recording')) {
    for (const recording of teachingRecordings) {
      const { score, matched } = explain(query, [
        { text: recording.title, weight: 10, name: 'title' },
        { text: recording.scripture ?? '', weight: 7, name: 'scripture' },
        { text: `${recording.series ?? ''} ${recording.place ?? ''}`, weight: 5, name: 'occasion' },
        { text: recording.summary ?? '', weight: 4, name: 'summary' },
        { text: recording.date, weight: 2, name: 'date' },
      ])
      if (score > 0) {
        hits.push({ kind: 'teaching-recording', recording, score, matchedFields: matched })
      }
    }
  }

  return hits.sort((a, b) => b.score - a.score)
}

/** Where a hit points, for a caller that only wants the address. */
export function hitHref(hit: SearchHit): string {
  if (hit.article) return hit.article.href
  if (hit.record) return recordHref(hit.record)
  if (hit.recording) return teachingHref(hit.recording)
  return '/'
}
