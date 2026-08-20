import { CATEGORIES, siteInfo, siteUrl } from '@/lib/content'
import { ERROR_CODES } from '@/lib/api/errors'
import { LANGUAGE, LIMIT_DEFAULT, LIMIT_MAX, QUERY_MAX } from '@/lib/api/params'
import { CONTENT_FORMAT } from '@/lib/api/resources'

/**
 * The API, described in the one format machines already read.
 *
 * Written as data rather than kept in a YAML file beside the code, so the
 * bounds it advertises are the same constants the routes enforce — a spec
 * that says `maximum: 100` because the validator says 100, not because
 * somebody remembered to update both.
 */

const ERROR = { $ref: '#/components/schemas/Error' }

function errorResponse(description: string) {
  return { description, content: { 'application/json': { schema: ERROR } } }
}

const PARAM = {
  page: {
    name: 'page',
    in: 'query',
    description: 'Which page of results, from 1.',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  limit: {
    name: 'limit',
    in: 'query',
    description: `How many items per page, up to ${LIMIT_MAX}.`,
    schema: { type: 'integer', minimum: 1, maximum: LIMIT_MAX, default: LIMIT_DEFAULT },
  },
  q: {
    name: 'q',
    in: 'query',
    description: 'Words to match. Every term must appear somewhere; where it appears decides what it is worth.',
    schema: { type: 'string', maxLength: QUERY_MAX },
  },
  category: {
    name: 'category',
    in: 'query',
    description: 'One section. Accepted as written ("Church History") or slugged ("church-history").',
    schema: { type: 'string', enum: [...CATEGORIES] },
  },
  tag: {
    name: 'tag',
    in: 'query',
    description: 'One tag, normalised to lowercase hyphenated form.',
    schema: { type: 'string' },
  },
  author: {
    name: 'author',
    in: 'query',
    description: 'A byline, matched in full and case-insensitively.',
    schema: { type: 'string' },
  },
  from: {
    name: 'from',
    in: 'query',
    description: 'Published on or after this calendar date.',
    schema: { type: 'string', format: 'date' },
  },
  to: {
    name: 'to',
    in: 'query',
    description: 'Published on or before this calendar date.',
    schema: { type: 'string', format: 'date' },
  },
  type: {
    name: 'type',
    in: 'query',
    description: 'Restrict a search to some kinds of item. Comma-separated.',
    schema: { type: 'string', example: 'article,prophecy-record' },
  },
} as const

function collection(schemaRef: string) {
  return {
    type: 'object',
    required: ['data', 'pagination'],
    properties: {
      data: { type: 'array', items: { $ref: schemaRef } },
      pagination: { $ref: '#/components/schemas/Pagination' },
      query: {
        type: 'object',
        description: 'The filters as the API understood them, echoed back.',
        additionalProperties: true,
      },
    },
  }
}

function jsonResponse(description: string, schema: object) {
  return { description, content: { 'application/json': { schema } } }
}

export function openApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: `${siteInfo.name} — public content API`,
      version: '1.0.0',
      summary: `The published archive of the ${siteInfo.ministry}, read-only.`,
      description: [
        `Written teachings, the prophetic record, and recorded sermons published by the ${siteInfo.ministry}.`,
        '',
        'Public and read-only: there is no key, no account and no write path. Every item carries a `canonicalUrl`,',
        'the page a person would read — quote or summarise freely and link it, so a reader can reach the teaching itself.',
        '',
        `Article bodies come three ways: \`content.text\` (plain), \`content.html\` (rendered), and \`content.source\`, which is the desk's own markup, named \`${CONTENT_FORMAT}\`. Prefer the first two unless you intend to parse the markup.`,
        '',
        'Unpublished work, the posting desk, reader questions and site analytics are not exposed here and are not reachable from this API.',
      ].join('\n'),
      contact: { name: siteInfo.ministry, url: `${siteUrl}/about` },
    },
    servers: [{ url: siteUrl, description: 'Production' }],
    externalDocs: { description: 'Developer documentation', url: `${siteUrl}/docs/api` },
    tags: [
      { name: 'discovery', description: 'What this API is and how to use it.' },
      { name: 'articles', description: 'Written teachings, doctrine, devotional pieces.' },
      { name: 'prophecies', description: 'Records of prophecies, held against their primary source.' },
      { name: 'teachings', description: 'Recorded sermons and teachings.' },
      { name: 'taxonomies', description: 'Sections, tags and bylines in use.' },
      { name: 'search', description: 'One query across the whole archive.' },
    ],
    paths: {
      '/api/v1': {
        get: {
          tags: ['discovery'],
          operationId: 'getServiceDescription',
          summary: 'What this API is, what it holds, and how to page through it.',
          responses: {
            200: jsonResponse('The service description.', { type: 'object', additionalProperties: true }),
          },
        },
      },
      '/api/openapi.json': {
        get: {
          tags: ['discovery'],
          operationId: 'getOpenApiDocument',
          summary: 'This document.',
          responses: {
            200: jsonResponse('The OpenAPI specification.', { type: 'object', additionalProperties: true }),
          },
        },
      },
      '/api/v1/articles': {
        get: {
          tags: ['articles'],
          operationId: 'listArticles',
          summary: 'List published articles, newest first.',
          description: 'Summaries only. Retrieve a body from the item endpoint, or from any row\'s `links.self`.',
          parameters: [PARAM.q, PARAM.category, PARAM.tag, PARAM.author, PARAM.from, PARAM.to, PARAM.page, PARAM.limit],
          responses: {
            200: jsonResponse('A page of articles.', collection('#/components/schemas/ArticleSummary')),
            400: errorResponse('A parameter was not understood.'),
          },
        },
      },
      '/api/v1/articles/{slug}': {
        get: {
          tags: ['articles'],
          operationId: 'getArticle',
          summary: 'One article, in full.',
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              description: 'The stable identifier, the same one in the public URL.',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: jsonResponse('The article.', {
              type: 'object',
              required: ['data'],
              properties: { data: { $ref: '#/components/schemas/ArticleDetail' } },
            }),
            404: errorResponse('No published article with that slug.'),
          },
        },
      },
      '/api/v1/prophecies': {
        get: {
          tags: ['prophecies'],
          operationId: 'listProphecies',
          summary: 'List prophecy records.',
          parameters: [PARAM.q, PARAM.tag, PARAM.page, PARAM.limit],
          responses: {
            200: jsonResponse('A page of records.', collection('#/components/schemas/ProphecyRecord')),
            400: errorResponse('A parameter was not understood.'),
          },
        },
      },
      '/api/v1/prophecies/{id}': {
        get: {
          tags: ['prophecies'],
          operationId: 'getProphecyRecord',
          summary: 'One record, with its timeline and independent documentation.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: jsonResponse('The record.', {
              type: 'object',
              required: ['data'],
              properties: { data: { $ref: '#/components/schemas/ProphecyRecordDetail' } },
            }),
            404: errorResponse('No record with that id.'),
          },
        },
      },
      '/api/v1/teachings': {
        get: {
          tags: ['teachings'],
          operationId: 'listTeachings',
          summary: 'List recorded teachings.',
          parameters: [PARAM.q, PARAM.page, PARAM.limit],
          responses: {
            200: jsonResponse('A page of recordings.', collection('#/components/schemas/TeachingRecording')),
            400: errorResponse('A parameter was not understood.'),
          },
        },
      },
      '/api/v1/teachings/{id}': {
        get: {
          tags: ['teachings'],
          operationId: 'getTeaching',
          summary: 'One recording.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: jsonResponse('The recording.', {
              type: 'object',
              required: ['data'],
              properties: { data: { $ref: '#/components/schemas/TeachingRecording' } },
            }),
            404: errorResponse('No recording with that id.'),
          },
        },
      },
      '/api/v1/categories': {
        get: {
          tags: ['taxonomies'],
          operationId: 'listCategories',
          summary: 'Sections that hold published writing, counted.',
          responses: {
            200: jsonResponse('The sections in use.', {
              type: 'object',
              properties: {
                data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                meta: { type: 'object', properties: { total: { type: 'integer' } } },
              },
            }),
          },
        },
      },
      '/api/v1/tags': {
        get: {
          tags: ['taxonomies'],
          operationId: 'listTags',
          summary: 'Tags in use, most-used first.',
          responses: {
            200: jsonResponse('The tags in use.', {
              type: 'object',
              properties: {
                data: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
                meta: { type: 'object', properties: { total: { type: 'integer' } } },
              },
            }),
          },
        },
      },
      '/api/v1/authors': {
        get: {
          tags: ['taxonomies'],
          operationId: 'listAuthors',
          summary: 'Bylines that have published, counted.',
          responses: {
            200: jsonResponse('The bylines in use.', {
              type: 'object',
              properties: {
                data: { type: 'array', items: { $ref: '#/components/schemas/Author' } },
                meta: { type: 'object', properties: { total: { type: 'integer' } } },
              },
            }),
          },
        },
      },
      '/api/v1/search': {
        get: {
          tags: ['search'],
          operationId: 'search',
          summary: 'Search articles, prophecy records and recordings together.',
          description:
            'Results are lightweight and carry `match.matchedFields`, naming where the query landed. Fetch the full item from `links.self`.',
          parameters: [
            { ...PARAM.q, required: true },
            PARAM.type, PARAM.category, PARAM.tag, PARAM.author, PARAM.from, PARAM.to, PARAM.page, PARAM.limit,
          ],
          responses: {
            200: jsonResponse('A page of results.', collection('#/components/schemas/SearchResult')),
            400: errorResponse('q was missing, too long, or a filter was not understood.'),
          },
        },
      },
    },
    components: {
      schemas: {
        Pagination: {
          type: 'object',
          required: ['page', 'limit', 'total', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer', description: 'Items matching the filters, across all pages.' },
            totalPages: { type: 'integer' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string', enum: [...ERROR_CODES] },
                message: { type: 'string' },
                parameter: { type: 'string', description: 'The parameter at fault, when one is.' },
                allowed: { type: 'array', items: { type: 'string' }, description: 'What would have been accepted.' },
              },
            },
          },
        },
        Links: {
          type: 'object',
          properties: {
            self: { type: 'string', format: 'uri', description: 'This item in this API.' },
            html: { type: 'string', format: 'uri', description: 'The page a person reads.' },
          },
        },
        AuthorRef: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            id: { type: 'string' },
            role: { type: 'string' },
            url: { type: 'string', format: 'uri' },
          },
        },
        CategoryRef: {
          type: 'object',
          required: ['name', 'slug', 'url'],
          properties: {
            name: { type: 'string', enum: [...CATEGORIES] },
            slug: { type: 'string' },
            url: { type: 'string', format: 'uri' },
          },
        },
        ArticleSummary: {
          type: 'object',
          required: ['id', 'type', 'slug', 'title', 'summary', 'author', 'category', 'tags', 'publishedAt', 'language', 'canonicalUrl'],
          properties: {
            id: { type: 'string', description: 'The slug. Stable; no database identifier is exposed.' },
            type: { type: 'string', const: 'article' },
            slug: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string', description: 'The published summary, as it appears under the headline.' },
            author: { $ref: '#/components/schemas/AuthorRef' },
            category: { $ref: '#/components/schemas/CategoryRef' },
            tags: { type: 'array', items: { type: 'string' } },
            publishedAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Absent on a piece never edited.' },
            language: { type: 'string', const: LANGUAGE },
            readingTimeMinutes: { type: 'integer' },
            canonicalUrl: { type: 'string', format: 'uri' },
            image: {
              type: 'object',
              properties: { url: { type: 'string', format: 'uri' }, alt: { type: 'string' } },
            },
            links: { $ref: '#/components/schemas/Links' },
          },
        },
        ArticleDetail: {
          allOf: [
            { $ref: '#/components/schemas/ArticleSummary' },
            {
              type: 'object',
              required: ['content', 'wordCount'],
              properties: {
                content: {
                  type: 'object',
                  required: ['format', 'source', 'text', 'html'],
                  properties: {
                    format: { type: 'string', const: CONTENT_FORMAT },
                    source: { type: 'string', description: "The desk's markup." },
                    text: { type: 'string', description: 'The body as plain prose.' },
                    html: { type: 'string', description: 'The body rendered.' },
                  },
                },
                wordCount: { type: 'integer' },
                headings: {
                  type: 'array',
                  description: 'The chapters of the piece, each with the anchor on the public page.',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      text: { type: 'string' },
                      url: { type: 'string', format: 'uri' },
                    },
                  },
                },
                scriptureRefs: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Passages the piece cites, in the order they appear.',
                },
                faqs: {
                  type: 'array',
                  description: 'Questions the piece answers directly.',
                  items: {
                    type: 'object',
                    properties: { q: { type: 'string' }, a: { type: 'string' } },
                  },
                },
                related: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      canonicalUrl: { type: 'string', format: 'uri' },
                      links: { $ref: '#/components/schemas/Links' },
                    },
                  },
                },
              },
            },
          ],
        },
        ProphecyRecord: {
          type: 'object',
          required: ['id', 'type', 'title', 'summary', 'canonicalUrl'],
          properties: {
            id: { type: 'string' },
            type: { type: 'string', const: 'prophecy-record' },
            recordId: { type: 'string', description: "The desk's record number, or TO BE ASSIGNED." },
            title: { type: 'string' },
            summary: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            location: { type: 'string' },
            subject: { type: 'string' },
            publishedAt: {
              type: ['string', 'null'],
              format: 'date-time',
              description: 'Null when the date has not been confirmed against the source; see dateNote.',
            },
            dateNote: { type: 'string', description: 'Present only when publishedAt is null.' },
            dateline: { type: 'string', description: 'The date as the ministry published it.' },
            fulfilledByMinistry: {
              type: 'boolean',
              description: "The ministry's own designation, reported as such. Not a verification by this API.",
            },
            language: { type: 'string', const: LANGUAGE },
            primarySource: { type: 'string', format: 'uri', description: 'The original recording.' },
            canonicalUrl: { type: 'string', format: 'uri' },
            links: { $ref: '#/components/schemas/Links' },
          },
        },
        ProphecyRecordDetail: {
          allOf: [
            { $ref: '#/components/schemas/ProphecyRecord' },
            {
              type: 'object',
              properties: {
                timeline: { type: 'array', items: { type: 'object', additionalProperties: true } },
                independentRecords: {
                  type: 'array',
                  description: 'Published records from bodies other than the ministry.',
                  items: { type: 'object', additionalProperties: true },
                },
              },
            },
          ],
        },
        TeachingRecording: {
          type: 'object',
          required: ['id', 'type', 'title', 'canonicalUrl'],
          properties: {
            id: { type: 'string' },
            type: { type: 'string', const: 'teaching-recording' },
            title: { type: 'string' },
            summary: { type: 'string' },
            dateline: { type: 'string' },
            year: { type: 'string' },
            place: { type: 'string' },
            series: { type: 'string' },
            scripture: { type: 'string' },
            language: { type: 'string', const: LANGUAGE },
            primarySource: { type: 'string', format: 'uri' },
            canonicalUrl: { type: 'string', format: 'uri' },
            links: { $ref: '#/components/schemas/Links' },
          },
        },
        SearchResult: {
          allOf: [
            {
              oneOf: [
                { $ref: '#/components/schemas/ArticleSummary' },
                { $ref: '#/components/schemas/ProphecyRecord' },
                { $ref: '#/components/schemas/TeachingRecording' },
              ],
            },
            {
              type: 'object',
              required: ['match'],
              properties: {
                match: {
                  type: 'object',
                  required: ['score', 'matchedFields'],
                  properties: {
                    score: {
                      type: 'number',
                      description: "This site's own weighting. Comparable within one response, meaningless outside it.",
                    },
                    matchedFields: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Which fields the query landed in, best first.',
                    },
                  },
                },
              },
            },
          ],
        },
        Category: {
          type: 'object',
          required: ['name', 'slug', 'articleCount', 'url'],
          properties: {
            name: { type: 'string', enum: [...CATEGORIES] },
            slug: { type: 'string' },
            description: { type: 'string' },
            articleCount: { type: 'integer' },
            url: { type: 'string', format: 'uri' },
          },
        },
        Tag: {
          type: 'object',
          required: ['tag', 'articleCount'],
          properties: { tag: { type: 'string' }, articleCount: { type: 'integer' } },
        },
        Author: {
          type: 'object',
          required: ['name', 'articleCount'],
          properties: {
            name: { type: 'string' },
            id: { type: 'string' },
            role: { type: 'string' },
            articleCount: { type: 'integer' },
            url: { type: 'string', format: 'uri' },
          },
        },
      },
    },
  }
}
