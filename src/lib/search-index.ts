import { prophecyRecords, recordHref } from '@/lib/prophecies'
import { listRealRows } from '@/lib/rows'
import { dateline, type SearchDoc } from '@/lib/search-docs'

/**
 * One flat index over everything the site holds — the writing and the
 * prophetic record — for the search overlay and the search page.
 *
 * It is built on the server and handed to the client as data, so the
 * overlay answers a keystroke without a round trip. Bodies are folded into
 * `text` for matching but are never sent as display copy.
 *
 * Server-only: it reads the article store. The type and the pure helpers
 * live in search-docs.ts, which the client imports instead.
 */
export async function buildSearchIndex(): Promise<SearchDoc[]> {
  const rows = await listRealRows()

  const articles: SearchDoc[] = rows.map((row) => ({
    kind:
      row.category === 'Prophecy'
        ? 'Prophecy'
        : row.category === 'Teachings'
          ? 'Teaching'
          : 'Article',
    title: row.title,
    href: row.href,
    date: dateline(row.publishedAt),
    ref: row.category,
    excerpt: row.dek,
    text: row.text,
  }))

  const records: SearchDoc[] = prophecyRecords.map((record) => ({
    kind: 'Prophecy',
    title: record.title,
    href: recordHref(record),
    date: record.date,
    ref: record.location,
    excerpt: record.summary,
    text: `${record.title}\n${record.summary}\n${record.tags.join(' ')}\n${record.location}\n${record.subject}`.toLowerCase(),
  }))

  return [...articles, ...records]
}
