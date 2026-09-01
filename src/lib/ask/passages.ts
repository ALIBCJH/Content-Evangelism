import { bodyToPlainText } from '@/lib/article-body'
import { siteUrl } from '@/lib/content'
import { prophecyRecords, recordHref } from '@/lib/prophecies'
import type { RealRow } from '@/lib/rows'
import { explain } from '@/lib/search-docs'
import { runtimeInWords, teachingHref, teachingRecordings } from '@/lib/teachings'
import { headingId } from '@/lib/toc'

/**
 * The archive, cut into the pieces an answer is actually made of.
 *
 * A whole teaching is the wrong unit for answering a question: it is two
 * thousand words, most of them about something else, and handing all of
 * it over is how the wrong paragraph ends up being paraphrased. A chapter
 * is the right unit — it is what the teaching itself says a section is
 * about, it is already anchored, and it is short enough to quote.
 *
 * The prophetic record and the recorded teachings come in whole, since a
 * record is already one short statement of one thing.
 *
 * Nothing here is embedded or indexed. The archive is a few dozen
 * documents and the site's own scorer already ranks them well; a vector
 * store would be a second copy of the corpus to keep in step, bought with
 * a monthly bill, to search thirteen teachings.
 */

export interface Passage {
  /** Where it came from, as the answer will cite it. */
  title: string
  /** The chapter within the piece, when it is one. */
  heading?: string
  url: string
  kind: 'article' | 'prophecy-record' | 'teaching-recording'
  text: string
  tags: string[]
  category?: string
}

/** How much of one chapter is worth handing over. */
const PASSAGE_MAX = 1400

/** No more than this from one teaching, so one piece cannot crowd out the rest. */
const PER_PIECE = 2

function trim(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= PASSAGE_MAX) return clean
  const cut = clean.slice(0, PASSAGE_MAX)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}

/**
 * One teaching, cut at its chapter headings.
 *
 * The run before the first heading is a passage of its own: it is the
 * opening of the teaching, and on a short piece it is the whole of it.
 */
export function sectionsOf(row: RealRow): Passage[] {
  const url = `${siteUrl}${row.href}`
  const chunks: { heading?: string; lines: string[] }[] = [{ lines: [] }]

  for (const line of row.body.split('\n')) {
    if (line.startsWith('## ')) chunks.push({ heading: line.slice(3).trim(), lines: [] })
    else chunks[chunks.length - 1].lines.push(line)
  }

  return chunks
    .map((chunk): Passage | null => {
      const text = trim(bodyToPlainText(chunk.lines.join('\n')))
      if (text.length < 40) return null
      return {
        title: row.title,
        ...(chunk.heading ? { heading: chunk.heading } : {}),
        url: chunk.heading ? `${url}#${headingId(chunk.heading)}` : url,
        kind: 'article' as const,
        text,
        tags: row.tags,
        category: row.category,
      }
    })
    .filter((passage): passage is Passage => passage !== null)
}

/** Everything the archive holds, as passages. */
export function allPassages(rows: RealRow[]): Passage[] {
  const articles = rows.flatMap(sectionsOf)

  const records: Passage[] = prophecyRecords.map((record) => ({
    title: record.title,
    url: `${siteUrl}${recordHref(record)}`,
    kind: 'prophecy-record',
    text: trim(
      `${record.summary} Location: ${record.location}. Subject: ${record.subject}. Delivered ${record.date}. ` +
        `The ministry designates this record ${record.fulfilled ? 'fulfilled' : 'not yet fulfilled'}.`
    ),
    tags: record.tags,
  }))

  const recordings: Passage[] = teachingRecordings.map((recording) => ({
    title: recording.title,
    url: `${siteUrl}${teachingHref(recording)}`,
    kind: 'teaching-recording',
    text: trim(
      [
        recording.summary,
        recording.scripture ? `Preached from ${recording.scripture}.` : '',
        recording.place ? `At ${recording.place}.` : '',
        recording.series ? `Part of ${recording.series}.` : '',
        recording.dated === 'published'
          ? `Published by the ministry on ${recording.date}.`
          : `Preached ${recording.date}.`,
        `It runs ${runtimeInWords(recording.seconds)}.`,
      ]
        .filter(Boolean)
        .join(' ')
    ),
    tags: [],
  }))

  return [...articles, ...records, ...recordings]
}

/**
 * The passages worth putting in front of the model, best first.
 *
 * Scored by the site's own weighting — a question's words in a chapter
 * heading count for far more than the same words halfway down a
 * paragraph — then thinned so no single teaching supplies more than two,
 * which is what stops one long piece about the rapture from answering
 * every question on the site.
 */
export function retrieve(passages: Passage[], question: string, limit = 6): Passage[] {
  const scored = passages
    .map((passage) => ({
      passage,
      score: explain(question, [
        { text: passage.heading ?? '', weight: 9, name: 'heading' },
        { text: passage.title, weight: 7, name: 'title' },
        { text: passage.tags.join(' '), weight: 5, name: 'tags' },
        { text: passage.text, weight: 1, name: 'text' },
      ]).score,
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)

  const kept: Passage[] = []
  const perPiece = new Map<string, number>()
  for (const { passage } of scored) {
    const seen = perPiece.get(passage.title) ?? 0
    if (seen >= PER_PIECE) continue
    perPiece.set(passage.title, seen + 1)
    kept.push(passage)
    if (kept.length >= limit) break
  }
  return kept
}
