import { bodyToHtml, bodyToPlainText, extractFaqs, wordCount } from '@/lib/article-body'
import { authorHref, categorySlug, siteUrl, topicHref, type Category, type Author } from '@/lib/content'
import { authorOfPiece } from '@/lib/authors'
import { recordHref, type ProphecyRecord } from '@/lib/prophecies'
import type { RealRow } from '@/lib/rows'
import { scriptureRefs } from '@/lib/scripture'
import {
  dateline,
  isoDuration,
  teachingHref,
  type TeachingRecording,
} from '@/lib/teachings'
import { extractHeadings } from '@/lib/toc'
import { watchHref } from '@/lib/youtube'
import { LANGUAGE } from '@/lib/api/params'

/**
 * What the archive looks like from outside.
 *
 * These are not the stored records. A stored article carries a body in the
 * desk's own markup, a house art palette, and a lower-cased haystack built
 * for the search box — none of which mean anything to somebody who did not
 * write this site. What goes out instead is the piece as it is published:
 * what it says, who wrote it, when, what it is filed under, and the address
 * of the page a person would read.
 *
 * Every resource carries `canonicalUrl`. It is the whole point of the API
 * for an agent that will quote this ministry to somebody: the answer it
 * gives should send them to the teaching itself, not to a paraphrase.
 */

export const CONTENT_FORMAT = 'ministry-markup'

export interface ResourceLinks {
  self: string
  html: string
}

function absolute(path: string): string {
  return `${siteUrl}${path}`
}

function categoryOf(category: Category) {
  return {
    name: category,
    slug: categorySlug(category),
    url: absolute(topicHref(category)),
  }
}

function authorOf(piece: { authorId?: string; authorName: string }, directory: Author[]) {
  const name = piece.authorName
  const author = authorOfPiece(directory, piece)
  return {
    name,
    ...(author
      ? { id: author.id, url: absolute(authorHref(author)), ...(author.role ? { role: author.role } : {}) }
      : {}),
  }
}

/**
 * An article as it appears in a listing or a search result: no body.
 *
 * The author directory is handed in rather than read here. It is one
 * store read, and a listing of a hundred articles that each fetched it
 * would be a hundred — so the route reads it once and passes it down.
 */
export function articleSummary(row: RealRow, directory: Author[]) {
  return {
    id: row.slug,
    type: 'article' as const,
    slug: row.slug,
    title: row.title,
    summary: row.dek,
    author: authorOf(row, directory),
    category: categoryOf(row.category),
    tags: row.tags,
    publishedAt: row.publishedAt,
    language: LANGUAGE,
    readingTimeMinutes: row.readMinutes,
    canonicalUrl: absolute(row.href),
    ...(row.imageUrl
      ? { image: { url: row.imageUrl.startsWith('http') ? row.imageUrl : absolute(row.imageUrl), alt: row.imageAlt ?? '' } }
      : {}),
    links: { self: absolute(`/api/v1/articles/${row.slug}`), html: absolute(row.href) },
  }
}

/**
 * The whole teaching.
 *
 * The body goes out three ways, because a caller wanting to render it, a
 * caller wanting to read it, and a caller wanting to edit it want three
 * different things — and the site already had all three renderers. The
 * source is the desk's markup, named by `format` so nobody has to guess
 * at the `@video` lines.
 *
 * The rest is what the site already derives for the page itself and an
 * agent would otherwise have to infer from prose: the chapter headings,
 * the passages cited, the questions the piece answers at its foot.
 */
export function articleDetail(row: RealRow, directory: Author[], related: RealRow[] = []) {
  return {
    ...articleSummary(row, directory),
    /* Absent rather than echoing publishedAt: a piece nobody has edited
       has no modification date, and inventing one would have an agent
       report a revision that never happened. */
    ...(row.updatedAt ? { updatedAt: row.updatedAt } : {}),
    content: {
      format: CONTENT_FORMAT,
      source: row.body,
      text: bodyToPlainText(row.body),
      html: bodyToHtml(row.body, siteUrl),
    },
    wordCount: wordCount(row.body),
    headings: extractHeadings(row.body).map((heading) => ({
      id: heading.id,
      text: heading.text,
      url: `${absolute(row.href)}#${heading.id}`,
    })),
    scriptureRefs: scriptureRefs(row.body),
    faqs: extractFaqs(row.body),
    related: related.map((other) => ({
      id: other.slug,
      title: other.title,
      canonicalUrl: absolute(other.href),
      links: { self: absolute(`/api/v1/articles/${other.slug}`) },
    })),
  }
}

/**
 * A prophecy record.
 *
 * Two fields need care rather than tidying. A record whose publication
 * date has not been confirmed against the source says so, in `dateNote`,
 * and leaves `publishedAt` null — a guessed date on a prophetic record is
 * the one error this archive must not make. And `fulfilled` is reported
 * as what it is: the ministry's own designation, not a verdict this API
 * is in a position to certify.
 */
export function prophecyResource(record: ProphecyRecord, full = false) {
  const iso = /^\d{4}-\d{2}-\d{2}/.test(record.published) ? record.published : null
  const summary = {
    id: record.id,
    type: 'prophecy-record' as const,
    recordId: record.rid,
    title: record.title,
    summary: record.summary,
    tags: record.tags,
    location: record.location,
    subject: record.subject,
    publishedAt: iso,
    ...(iso ? {} : { dateNote: record.published }),
    dateline: record.date,
    fulfilledByMinistry: record.fulfilled,
    language: LANGUAGE,
    primarySource: watchHref(record.video),
    canonicalUrl: absolute(recordHref(record)),
    links: { self: absolute(`/api/v1/prophecies/${record.id}`), html: absolute(recordHref(record)) },
  }
  if (!full) return summary
  return {
    ...summary,
    timeline: record.timeline,
    independentRecords: record.independent,
  }
}

/** A recorded teaching. The recording is the source; this is its record. */
export function teachingResource(recording: TeachingRecording) {
  return {
    id: recording.id,
    type: 'teaching-recording' as const,
    title: recording.title,
    summary: recording.summary,
    dateline: dateline(recording),
    dated: recording.dated,
    year: recording.year,
    durationSeconds: recording.seconds,
    duration: isoDuration(recording.seconds),
    published: recording.uploaded,
    ...(recording.place ? { place: recording.place } : {}),
    ...(recording.series ? { series: recording.series } : {}),
    ...(recording.scripture ? { scripture: recording.scripture } : {}),
    language: LANGUAGE,
    primarySource: watchHref(recording.video),
    canonicalUrl: absolute(teachingHref(recording)),
    links: {
      self: absolute(`/api/v1/teachings/${recording.id}`),
      html: absolute(teachingHref(recording)),
    },
  }
}
