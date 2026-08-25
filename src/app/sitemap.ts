import type { MetadataRoute } from 'next'
import { altarEntries, altarPath } from '@/lib/altars'
import { listAnswers } from '@/lib/questions'
import { authorHref, siteUrl, topicHref } from '@/lib/content'
import { authorDirectory, authorOfPiece } from '@/lib/authors'
import { prophecyRecords, recordHref } from '@/lib/prophecies'
import { listRealRows } from '@/lib/rows'
import { absoluteUrl } from '@/lib/seo'

/**
 * Every page worth crawling, and nothing else.
 *
 * Deliberately absent:
 *   /search — a utility, noindex; its result pages are thin duplicates.
 *   /admin — noindex and disallowed.
 *
 * Topic and author pages appear only once something is filed under them,
 * so the sitemap never advertises a URL that 404s.
 */

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rows, answers] = await Promise.all([listRealRows(), listAnswers()])
  const newest = rows[0]?.publishedAt

  /* The questions answered in the open, and their index — offered only
     once there is something under it, like the topic and author pages. */
  const questions: MetadataRoute.Sitemap = answers.length
    ? [
        {
          url: `${siteUrl}/questions`,
          lastModified: answers[0].publishedAt,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        },
        ...answers.map((answer) => ({
          url: `${siteUrl}/questions/${answer.slug}`,
          lastModified: answer.publishedAt,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        })),
      ]
    : []

  const articles: MetadataRoute.Sitemap = rows.map((row) => ({
    url: `${siteUrl}${row.href}`,
    lastModified: row.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
    ...(row.imageUrl ? { images: [absoluteUrl(row.imageUrl)] } : {}),
  }))

  /* One entry per category that actually has pieces filed under it,
     stamped with the newest piece in that category. */
  const topics = new Map<string, string>()
  for (const row of rows) {
    const href = topicHref(row.category)
    if (!topics.has(href)) topics.set(href, row.publishedAt)
  }

  /* Likewise for bylines that resolve to an author profile — the
     ministry's standing masthead and everybody given a desk since. */
  const directory = await authorDirectory()
  const authorPages = new Map<string, string>()
  for (const row of rows) {
    const author = authorOfPiece(directory, row)
    if (!author) continue
    const href = authorHref(author)
    if (!authorPages.has(href)) authorPages.set(href, row.publishedAt)
  }

  const derived = (entries: Map<string, string>, priority: number): MetadataRoute.Sitemap =>
    Array.from(entries, ([href, lastModified]) => ({
      url: `${siteUrl}${href}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority,
    }))

  /* The prophecy archive and its records. Publication dates that are still
     to be confirmed against the source are left unstamped rather than
     guessed at. */
  const records: MetadataRoute.Sitemap = prophecyRecords.map((record) => ({
    url: `${siteUrl}${recordHref(record)}`,
    ...(record.published !== 'To confirm' ? { lastModified: record.published } : {}),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  /* One entry per altar. These are the pages a local search can land on
     — "repentance and holiness church nakuru" — and a page nobody crawls
     answers nobody. */
  const altars: MetadataRoute.Sitemap = altarEntries.map((entry) => ({
    url: `${siteUrl}${altarPath(entry)}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const sections: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/prophecies`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${siteUrl}/teachings`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${siteUrl}/about`, priority: 0.6, changeFrequency: 'monthly' as const },
    /* Where the ministry meets. A local search — "repentance and holiness
       Nakuru" — is one of the few queries this site can answer better
       than anyone else, and it cannot answer it from a page nobody
       crawls. */
    { url: `${siteUrl}/altars`, priority: 0.7, changeFrequency: 'monthly' as const },
    /* The API's own documentation is a public page like any other, and a
       crawler that indexes it is one more way an agent finds the API. */
    { url: `${siteUrl}/docs/api`, priority: 0.4, changeFrequency: 'monthly' as const },
  ]

  return [
    {
      url: siteUrl,
      lastModified: newest,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...sections,
    ...altars,
    ...questions,
    ...articles,
    ...records,
    ...derived(topics, 0.7),
    ...derived(authorPages, 0.5),
  ]
}
