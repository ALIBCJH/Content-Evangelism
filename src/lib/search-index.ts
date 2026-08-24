import { altarEntries, altarPath, countyNumber } from '@/lib/altars'
import { bodyToPlainText } from '@/lib/article-body'
import { listAnswers } from '@/lib/questions'
import { prophecyRecords, recordHref } from '@/lib/prophecies'
import { listRealRows } from '@/lib/rows'
import { dateline, type SearchDoc } from '@/lib/search-docs'
import { teachingHref, teachingRecordings } from '@/lib/teachings'

/**
 * One flat index over everything the site holds — the writing, the
 * prophetic record, the recorded teachings, the altars and the questions
 * answered in the open — for the search overlay and the search page.
 *
 * The recordings were missing from it until now, which meant a reader who
 * searched for a teaching by name was told the site had nothing, while
 * the teaching sat on its own page. An archive that cannot find its own
 * holdings is not an archive.
 *
 * The altars were missing for the same reason and cost more: a reader who
 * typed their own county into the masthead — the most local question this
 * site can be asked — was told there was nothing, while the altar sat on
 * a page one click away.
 *
 * It is built on the server and handed to the client as data, so the
 * overlay answers a keystroke without a round trip. Bodies are folded into
 * `text` for matching but are never sent as display copy.
 *
 * Server-only: it reads the article store. The type and the pure helpers
 * live in search-docs.ts, which the client imports instead.
 */
export async function buildSearchIndex(): Promise<SearchDoc[]> {
  const [rows, answers] = await Promise.all([listRealRows(), listAnswers()])

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

  /* An altar is not a document and has no date, so the slot the other
     three print a dateline in carries the county's number and name — the
     locator a reader is actually scanning the row for. */
  const altars: SearchDoc[] = altarEntries.map((entry) => {
    const { county, altar } = entry
    return {
      kind: 'Altar',
      title: altar.name,
      href: altarPath(entry),
      date: `${countyNumber(county.no)} · ${county.name.toUpperCase()}`,
      ref: `${county.name} County · ${altar.area}`,
      excerpt: `${altar.area} — where the ministry meets in ${county.name} County.`,
      text: [
        altar.name,
        altar.area,
        county.name,
        `${county.name} county`,
        altar.phone,
        'altar church service where we meet location directions sunday',
      ]
        .filter(Boolean)
        .join('\n')
        .toLowerCase(),
    }
  })

  /* An answer is found by the question, which is what a reader types —
     so the question is the title and the answer is the haystack. */
  const questions: SearchDoc[] = answers.map((answer) => {
    const plain = bodyToPlainText(answer.answer)
    return {
      kind: 'Answer',
      title: answer.question,
      href: `/questions/${answer.slug}`,
      date: dateline(answer.publishedAt),
      ref: 'Questions answered',
      excerpt: plain.slice(0, 220),
      text: `${answer.question}\n${plain}\nquestion answered asked`.toLowerCase(),
    }
  })

  return [...articles, ...records, ...recordings, ...altars, ...questions]
}
