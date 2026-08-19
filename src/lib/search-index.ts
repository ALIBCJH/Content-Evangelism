import { prophecyRecords, recordHref } from '@/lib/prophecies'
import { listRealRows } from '@/lib/rows'
import { dateline, type SearchDoc } from '@/lib/search-docs'
import { teachingHref, teachingRecordings } from '@/lib/teachings'

/**
 * One flat index over everything the site holds — the writing, the
 * prophetic record and the recorded teachings — for the search overlay
 * and the search page.
 *
 * The recordings were missing from it until now, which meant a reader who
 * searched for a teaching by name was told the site had nothing, while
 * the teaching sat on its own page. An archive that cannot find its own
 * holdings is not an archive.
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
    /* What a reader searching a record has in mind: where, and about
       what. The record id is here too, since the desk cites them. */
    ref: `${record.location} · ${record.subject}`,
    excerpt: record.summary,
    text: `${record.title}\n${record.summary}\n${record.tags.join(' ')}\n${record.location}\n${record.subject}\n${record.rid}\n${record.fulfilled ? 'fulfilled' : ''}`.toLowerCase(),
  }))

  const recordings: SearchDoc[] = teachingRecordings.map((recording) => ({
    kind: 'Teaching',
    title: recording.title,
    href: teachingHref(recording),
    date: recording.date,
    ref: [recording.place, recording.series].filter(Boolean).join(' · ') || 'Recording',
    excerpt: recording.summary ?? 'A recording published by the ministry on its own channel.',
    text: [
      recording.title,
      recording.summary,
      recording.place,
      recording.series,
      recording.scripture,
      'recording video sermon teaching',
    ]
      .filter(Boolean)
      .join('\n')
      .toLowerCase(),
  }))

  return [...articles, ...records, ...recordings]
}
