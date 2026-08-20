/**
 * What the API says when it cannot answer.
 *
 * One envelope, always the same shape, with a code an agent can branch on
 * and a sentence a person can read. The codes are a closed set: an agent
 * that has seen this file knows every failure it can be handed.
 *
 * The reader-facing routes under /api answer with `{ error: "…" }` and
 * keep doing so — the posting desk reads that shape. This envelope is v1's
 * and nothing else's.
 */

export const ERROR_CODES = [
  'INVALID_PARAMETER',
  'QUERY_TOO_LONG',
  'ARTICLE_NOT_FOUND',
  'RECORD_NOT_FOUND',
  'TEACHING_NOT_FOUND',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export interface ApiError {
  code: ErrorCode
  message: string
  /** The parameter at fault, when one is. */
  parameter?: string
  /** What would have been accepted, when the set is small enough to say. */
  allowed?: string[]
}

const STATUS: Record<ErrorCode, number> = {
  INVALID_PARAMETER: 400,
  QUERY_TOO_LONG: 400,
  ARTICLE_NOT_FOUND: 404,
  RECORD_NOT_FOUND: 404,
  TEACHING_NOT_FOUND: 404,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
}

export function statusFor(code: ErrorCode): number {
  return STATUS[code]
}

export function apiError(
  code: ErrorCode,
  message: string,
  extra: Omit<ApiError, 'code' | 'message'> = {}
): ApiError {
  return { code, message, ...extra }
}
