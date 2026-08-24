/**
 * The desk's session — what the browser carries once a key has been
 * accepted, so the key itself is never carried again.
 *
 * Until now every page under /admin held the key in React state and put
 * it in an Authorization header, which meant three things: the key was
 * readable by any script on the page, it had to be retyped on every desk
 * and after every refresh, and the desk rendered in full to somebody who
 * had no key at all. The gate replaces all three. A key is presented once,
 * checked on the server, and exchanged for this — a signed statement of
 * which desk the holder may use, and until when.
 *
 * The cookie carries no secret. It carries a role and an expiry with an
 * HMAC over both, so a reader who copies it out of their own browser
 * learns nothing they can post with, and a reader who edits `writer` to
 * `reviewer` invalidates the signature.
 *
 * Everything here is Web Crypto rather than node:crypto, because the
 * middleware that reads a session runs on the edge runtime where
 * node:crypto is not available. Web Crypto exists in both.
 */

/** The two desks. A reviewer may do anything a writer may. */
export type DeskRole = 'writer' | 'reviewer'

export const DESK_COOKIE = 'desk_session'

/**
 * Long enough for an evening at the desk, short enough that a session
 * left open on a borrowed laptop dies on its own.
 */
export const SESSION_HOURS = 12

const encoder = new TextEncoder()

/**
 * The signing secret, derived from the desk keys rather than configured
 * separately.
 *
 * This is deliberate: it means rotating a key — the thing you do when you
 * think one has escaped — also invalidates every session minted with it,
 * without anybody having to remember a second variable. No ADMIN_TOKEN
 * means no secret, which means no session can be minted or verified, and
 * the desk is shut rather than open to everyone.
 */
function secret(): string {
  const write = process.env.ADMIN_TOKEN ?? ''
  const review = process.env.REVIEW_TOKEN ?? ''
  return write ? `desk.v1.${write}.${review}` : ''
}

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sign(payload: string): Promise<string> {
  const material = secret()
  if (!material) return ''
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(material),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))
}

/**
 * A comparison whose duration does not depend on how much of the
 * signature was right. Both sides are base64 of SHA-256 and so the same
 * length; an early return on a length mismatch leaks nothing.
 */
function sameSignature(a: string, b: string): boolean {
  if (a.length === 0 || a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return difference === 0
}

/** Mint a session for a key that has already been checked. */
export async function mintSession(role: DeskRole, now: number): Promise<string> {
  const expires = now + SESSION_HOURS * 3600_000
  const payload = `${role}.${expires}`
  const signature = await sign(payload)
  return signature ? `${payload}.${signature}` : ''
}

/**
 * The role a cookie proves, or null — for an absent cookie, a malformed
 * one, an expired one, one signed with a key that has since been rotated,
 * and one whose role has been edited.
 */
export async function readSession(
  value: string | undefined,
  now: number
): Promise<DeskRole | null> {
  if (!value) return null
  const parts = value.split('.')
  if (parts.length !== 3) return null
  const [role, expires, signature] = parts
  if (role !== 'writer' && role !== 'reviewer') return null

  const at = Number(expires)
  if (!Number.isFinite(at) || at <= now) return null

  const expected = await sign(`${role}.${expires}`)
  return sameSignature(expected, signature) ? role : null
}

/** One cookie out of a request's header, without pulling in a parser. */
export function cookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie')
  if (!header) return undefined
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    const equals = trimmed.indexOf('=')
    if (equals > 0 && trimmed.slice(0, equals) === name) return trimmed.slice(equals + 1)
  }
  return undefined
}

/**
 * Whether a request came from this site, for the purpose of honouring its
 * cookie.
 *
 * A cookie is sent by the browser whether or not the page that triggered
 * the request belongs to us, which is what makes cookie authentication
 * forgeable in a way a header never was. SameSite=Lax already withholds
 * the cookie from every cross-site subrequest — every write here is a
 * POST, PATCH or DELETE, and Lax sends on none of them — and this is the
 * second lock on the same door, in the request rather than in the
 * browser's policy.
 *
 * A request with neither header is not a browser, and a client that is
 * not a browser does not have our cookie to send; those authenticate with
 * a Bearer token and never reach this check.
 */
export function fromThisSite(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site) return site === 'same-origin' || site === 'none'

  const origin = request.headers.get('origin')
  if (!origin) return true
  const host = request.headers.get('host')
  try {
    return Boolean(host) && new URL(origin).host === host
  } catch {
    return false
  }
}

/**
 * Where to send somebody once their key is accepted.
 *
 * `from` arrives in a query string, and a query string is written by
 * whoever sent the link. A sign-in page that redirects wherever it is
 * told is somebody else's front door: send a ministry worker a link to
 * /admin/login?from=https://not-the-ministry.example, they sign in
 * correctly, and they land on a copy of this desk asking for the key
 * again. So only a path, and only one at this desk.
 *
 * The second test is not redundant with the first. "//evil.example" is a
 * protocol-relative URL — a browser reads it as another host — and it
 * would pass a startsWith('/') check without difficulty.
 */
export function safeDeskReturn(from: unknown): string {
  const asked = typeof from === 'string' ? from : ''
  if (asked.startsWith('//') || asked.startsWith('/\\')) return '/admin'
  return asked === '/admin' || asked.startsWith('/admin/') || asked.startsWith('/admin?')
    ? asked
    : '/admin'
}
