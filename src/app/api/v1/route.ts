import { siteInfo, siteUrl } from '@/lib/content'
import { LANGUAGE, LIMIT_DEFAULT, LIMIT_MAX, QUERY_MAX } from '@/lib/api/params'
import { CONTENT_FORMAT } from '@/lib/api/resources'
import { OPENAPI_PATH, ok } from '@/lib/api/respond'
import { ERROR_CODES } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1 — what this is, and what may be asked of it.
 *
 * The entry point an agent lands on when it follows the `service-desc`
 * link, the robots.txt pointer, or a guess at the version root. It answers
 * the questions that have to be answered before any other request is worth
 * making: whose archive this is, what it holds, what the endpoints are,
 * how paging works, what a failure looks like, and what may be done with
 * what it returns.
 *
 * The full contract is the OpenAPI document; this is the page that gets
 * an agent there, and is short enough to read in one pass.
 */
export async function GET() {
  return ok({
    name: `${siteInfo.name} — public content API`,
    version: 'v1',
    description:
      `The published archive of the ${siteInfo.ministry}: written teachings, the prophetic record, and recorded sermons. ` +
      'Read-only. No key, no account, no write access.',
    publisher: {
      name: siteInfo.ministry,
      site: siteUrl,
      about: `${siteUrl}/about`,
    },
    language: LANGUAGE,
    languages: [LANGUAGE],
    documentation: {
      openapi: `${siteUrl}${OPENAPI_PATH}`,
      humanReadable: `${siteUrl}/docs/api`,
    },
    collections: {
      articles: {
        url: `${siteUrl}/api/v1/articles`,
        item: `${siteUrl}/api/v1/articles/{slug}`,
        description: 'Written teachings, doctrine and devotional pieces. The slug is the stable identifier and matches the public page.',
        filters: ['q', 'category', 'tag', 'author', 'from', 'to', 'page', 'limit'],
      },
      prophecies: {
        url: `${siteUrl}/api/v1/prophecies`,
        item: `${siteUrl}/api/v1/prophecies/{id}`,
        description: 'Records of prophecies as delivered, each held against its primary source recording.',
        filters: ['q', 'tag', 'page', 'limit'],
      },
      teachings: {
        url: `${siteUrl}/api/v1/teachings`,
        item: `${siteUrl}/api/v1/teachings/{id}`,
        description: 'Recorded sermons and teachings the archive holds.',
        filters: ['q', 'page', 'limit'],
      },
    },
    taxonomies: {
      categories: `${siteUrl}/api/v1/categories`,
      tags: `${siteUrl}/api/v1/tags`,
      authors: `${siteUrl}/api/v1/authors`,
    },
    search: {
      url: `${siteUrl}/api/v1/search`,
      description:
        'One query across all three collections. Results are summaries and say which fields the query matched; retrieve the full item from its links.self.',
      required: ['q'],
      filters: ['type', 'category', 'tag', 'author', 'from', 'to', 'page', 'limit'],
      maxQueryLength: QUERY_MAX,
    },
    pagination: {
      style: 'page-and-limit',
      defaultLimit: LIMIT_DEFAULT,
      maxLimit: LIMIT_MAX,
      shape: 'Every collection returns { data: [...], pagination: { page, limit, total, totalPages, hasNextPage, hasPreviousPage } }.',
    },
    errors: {
      shape: '{ "error": { "code", "message", "parameter?", "allowed?" } }',
      codes: ERROR_CODES,
    },
    contentFormat: {
      /* An agent receiving `content.source` is holding the desk's own
         markup. Rather than leave it to guess at the `@video` lines, the
         plain text and the HTML are in the same response, and the source
         grammar is named. */
      name: CONTENT_FORMAT,
      note: 'Article bodies are returned three ways: content.text (plain), content.html (rendered), content.source (the desk markup named here).',
    },
    usage: {
      access: 'public, read-only',
      methods: ['GET'],
      authentication: 'none',
      attribution: `Quote or summarise freely; link the canonicalUrl of the piece so a reader can reach ${siteInfo.ministry} directly.`,
      note: 'Writing is not exposed. Publishing happens at the desk, behind a key, on routes this API does not describe.',
    },
  })
}
