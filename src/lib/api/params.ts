import { CATEGORIES, type Category } from '@/lib/content'
import { normaliseTags } from '@/lib/posted'
import { apiError, type ApiError } from '@/lib/api/errors'

/**
 * Query parameters, checked before anything touches the archive.
 *
 * Every bound here exists to keep one caller from being expensive: a page
 * number that is really a request for the whole store, a query string
 * long enough to be a payload, a limit of ten thousand. Anything outside
 * the bounds is refused by name rather than quietly clamped, because an
 * agent that asked for 500 and received 100 without being told has no way
 * to know its pagination is wrong.
 */

export const LIMIT_DEFAULT = 20
export const LIMIT_MAX = 100
export const QUERY_MAX = 200
/** The only language this archive publishes in. */
export const LANGUAGE = 'en'

export interface CollectionParams {
  page: number
  limit: number
  q: string
  category?: Category
  tag?: string
  author?: string
  from?: string
  to?: string
}

type Parsed = { ok: true; value: CollectionParams } | { ok: false; error: ApiError }

function invalid(parameter: string, message: string, allowed?: string[]): Parsed {
  return {
    ok: false,
    error: apiError('INVALID_PARAMETER', message, { parameter, ...(allowed ? { allowed } : {}) }),
  }
}

/** An ISO calendar date, as a date filter is written: 2026-08-20. */
function isCalendarDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime())
}

export function parseParams(url: URL): Parsed {
  const get = (key: string) => (url.searchParams.get(key) ?? '').trim()

  const pageRaw = get('page') || '1'
  if (!/^\d+$/.test(pageRaw) || Number(pageRaw) < 1) {
    return invalid('page', 'page must be a whole number of 1 or more.')
  }

  const limitRaw = get('limit') || String(LIMIT_DEFAULT)
  if (!/^\d+$/.test(limitRaw) || Number(limitRaw) < 1) {
    return invalid('limit', 'limit must be a whole number of 1 or more.')
  }
  if (Number(limitRaw) > LIMIT_MAX) {
    return invalid('limit', `limit may not exceed ${LIMIT_MAX}.`)
  }

  const q = get('q')
  if (q.length > QUERY_MAX) {
    return {
      ok: false,
      error: apiError('QUERY_TOO_LONG', `q may not exceed ${QUERY_MAX} characters.`, {
        parameter: 'q',
      }),
    }
  }

  const categoryRaw = get('category')
  let category: Category | undefined
  if (categoryRaw) {
    /* Accepted as it is written on the site or as it appears in a URL:
       "Church History", "church-history" and "church history" are the
       same section. */
    const wanted = categoryRaw.toLowerCase().replace(/[-_]+/g, ' ')
    category = CATEGORIES.find((name) => name.toLowerCase() === wanted)
    if (!category) {
      return invalid('category', `Unknown category: ${categoryRaw}.`, [...CATEGORIES])
    }
  }

  /* A tag is normalised the same way going in as it was going into the
     store, so ?tag=Second%20Coming finds what is filed as second-coming. */
  const tag = normaliseTags(get('tag'))[0]

  const language = get('language')
  if (language && language.toLowerCase() !== LANGUAGE) {
    return invalid('language', `This archive publishes in ${LANGUAGE} only.`, [LANGUAGE])
  }

  const from = get('from')
  if (from && !isCalendarDate(from)) {
    return invalid('from', 'from must be a calendar date, as 2026-08-20.')
  }
  const to = get('to')
  if (to && !isCalendarDate(to)) {
    return invalid('to', 'to must be a calendar date, as 2026-08-20.')
  }
  if (from && to && from > to) {
    return invalid('to', 'to must not fall before from.')
  }

  return {
    ok: true,
    value: {
      page: Number(pageRaw),
      limit: Number(limitRaw),
      q,
      ...(category ? { category } : {}),
      ...(tag ? { tag } : {}),
      ...(get('author') ? { author: get('author') } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    },
  }
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** One page of a collection, and the counts an agent needs to walk it. */
export function paginate<T>(items: T[], page: number, limit: number): {
  window: T[]
  pagination: Pagination
} {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit
  return {
    window: items.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: start + limit < total,
      hasPreviousPage: page > 1 && start < total,
    },
  }
}
