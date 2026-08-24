import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The door in front of the desk.
 *
 * What is being defended here is not glamorous — it is the queue of
 * readers' questions, some carrying an email address given in confidence,
 * and the ability to put words on the site under the ministry's name. The
 * cookie that opens it is signed rather than secret-bearing, which only
 * helps if every way of forging one is actually refused. So: an edited
 * role, an expired session, a session signed with a key that has since
 * been rotated, and a cookie replayed from another site.
 */

const WRITE = 'posting-key-aaaaaaaaaaaaaaaaaaa'
const REVIEW = 'review-key-bbbbbbbbbbbbbbbbbbbb'
const NOW = 1_700_000_000_000

async function session(env: { admin?: string; review?: string } = {}) {
  vi.resetModules()
  vi.stubEnv('ADMIN_TOKEN', env.admin ?? WRITE)
  vi.stubEnv('REVIEW_TOKEN', env.review ?? REVIEW)
  return import('@/lib/desk-session')
}

afterEach(() => vi.unstubAllEnvs())

describe('minting and reading a session', () => {
  it('reads back the role it was minted for', async () => {
    const { mintSession, readSession } = await session()
    const cookie = await mintSession('reviewer', NOW)
    expect(await readSession(cookie, NOW)).toEqual({ role: 'reviewer' })
  })

  /* A session bought with one of the ministry's own env keys belongs to
     the ministry, not to a person, and says so rather than inventing
     somebody to attribute the evening's work to. */
  it('carries no writer when the key was the ministry’s own', async () => {
    const { mintSession, readSession } = await session()
    const read = await readSession(await mintSession('writer', NOW), NOW)
    expect(read?.writer).toBeUndefined()
  })

  it('carries the writer it was minted for', async () => {
    const { mintSession, readSession } = await session()
    const cookie = await mintSession({ role: 'writer', writer: 'simon-juma' }, NOW)
    expect(await readSession(cookie, NOW)).toEqual({ role: 'writer', writer: 'simon-juma' })
  })

  /* The whole reason the cookie is signed rather than merely opaque. */
  it('refuses a cookie whose writer has been swapped', async () => {
    const { mintSession, readSession } = await session()
    const cookie = await mintSession({ role: 'writer', writer: 'simon-juma' }, NOW)
    expect(await readSession(cookie.replace('simon-juma', 'someone-else'), NOW)).toBeNull()
  })

  /* The shape changed once: role and expiry, with no version and no
     writer. Such a cookie is refused rather than migrated, which sends
     its holder to the door — the correct outcome for a session minted
     before the site knew who anybody was. */
  it('refuses a session in the shape used before writers existed', async () => {
    const { readSession } = await session()
    expect(await readSession(`reviewer.${NOW + 3600_000}.whatever`, NOW)).toBeNull()
  })

  it('carries no part of the key it was bought with', async () => {
    const { mintSession } = await session()
    const cookie = await mintSession('writer', NOW)
    expect(cookie).not.toContain(WRITE)
    expect(cookie).not.toContain(REVIEW)
  })

  it('refuses a cookie whose role has been edited', async () => {
    const { mintSession, readSession } = await session()
    const cookie = await mintSession('writer', NOW)
    const promoted = cookie.replace('.writer.', '.reviewer.')
    expect(await readSession(promoted, NOW)).toBeNull()
  })

  it('refuses a cookie whose expiry has been pushed out', async () => {
    const { mintSession, readSession } = await session()
    const [role, expires, signature] = (await mintSession('writer', NOW)).split('.')
    const later = `${role}.${Number(expires) + 86_400_000}.${signature}`
    expect(await readSession(later, NOW)).toBeNull()
  })

  it('refuses a session that has run out', async () => {
    const { mintSession, readSession, SESSION_HOURS } = await session()
    const cookie = await mintSession('writer', NOW)
    const past = NOW + SESSION_HOURS * 3600_000 + 1
    expect(await readSession(cookie, past)).toBeNull()
  })

  /* The reason there is no separate signing secret to remember: rotating
     the key you rotate when you fear one has escaped is the same act as
     ending every session bought with it. */
  it('refuses a session minted before the key was rotated', async () => {
    const before = await session()
    const cookie = await before.mintSession('reviewer', NOW)

    const after = await session({ admin: 'posting-key-ccccccccccccccccccc' })
    expect(await after.readSession(cookie, NOW)).toBeNull()
  })

  it('refuses everything when no key is configured at all', async () => {
    const shut = await session({ admin: '', review: '' })
    expect(await shut.mintSession('reviewer', NOW)).toBe('')
    expect(await shut.readSession('v2.reviewer.-.99999999999999.x', NOW)).toBeNull()
  })

  it('refuses nonsense without throwing', async () => {
    const { readSession } = await session()
    for (const value of [undefined, '', 'x', 'a.b', 'writer.abc.def', 'a.b.c.d', 'v9.writer.-.1.x']) {
      expect(await readSession(value, NOW)).toBeNull()
    }
  })
})

describe('reading a cookie off a request', () => {
  it('finds the one it is asked for among others', async () => {
    const { cookieValue } = await session()
    const request = new Request('https://read.test/admin', {
      headers: { cookie: 'first=1; desk_session=abc.def.ghi; last=2' },
    })
    expect(cookieValue(request, 'desk_session')).toBe('abc.def.ghi')
  })

  it('is undefined when there is no cookie header at all', async () => {
    const { cookieValue } = await session()
    expect(cookieValue(new Request('https://read.test/'), 'desk_session')).toBeUndefined()
  })

  /* A name that is a suffix of another must not match it, or `session`
     would be answered with `desk_session`'s value. */
  it('does not match a cookie whose name merely ends the same way', async () => {
    const { cookieValue } = await session()
    const request = new Request('https://read.test/', {
      headers: { cookie: 'desk_session=real' },
    })
    expect(cookieValue(request, 'session')).toBeUndefined()
  })
})

describe('whether a request may use its cookie', () => {
  const withHeaders = (headers: Record<string, string>) =>
    new Request('https://read.test/api/articles', { method: 'POST', headers })

  it('accepts this site', async () => {
    const { fromThisSite } = await session()
    expect(fromThisSite(withHeaders({ 'sec-fetch-site': 'same-origin' }))).toBe(true)
    expect(fromThisSite(withHeaders({ 'sec-fetch-site': 'none' }))).toBe(true)
  })

  it('refuses a request another site caused', async () => {
    const { fromThisSite } = await session()
    expect(fromThisSite(withHeaders({ 'sec-fetch-site': 'cross-site' }))).toBe(false)
    expect(fromThisSite(withHeaders({ 'sec-fetch-site': 'same-site' }))).toBe(false)
  })

  it('falls back to Origin against Host where Sec-Fetch-Site is absent', async () => {
    const { fromThisSite } = await session()
    expect(
      fromThisSite(withHeaders({ origin: 'https://read.test', host: 'read.test' }))
    ).toBe(true)
    expect(
      fromThisSite(withHeaders({ origin: 'https://elsewhere.test', host: 'read.test' }))
    ).toBe(false)
  })

  /* Not a browser, and so not a holder of our cookie. It authenticates
     with a Bearer token and is turned away by the key check, not here. */
  it('allows a request with neither header', async () => {
    const { fromThisSite } = await session()
    expect(fromThisSite(withHeaders({}))).toBe(true)
  })
})

describe('which desk a key opens', () => {
  async function posted(env: { admin?: string; review?: string } = {}) {
    vi.resetModules()
    vi.stubEnv('ADMIN_TOKEN', env.admin ?? WRITE)
    vi.stubEnv('REVIEW_TOKEN', env.review ?? REVIEW)
    return import('@/lib/posted')
  }

  it('tells the two keys apart', async () => {
    const { roleForKey } = await posted()
    expect(roleForKey(WRITE)).toBe('writer')
    expect(roleForKey(REVIEW)).toBe('reviewer')
  })

  it('refuses a key that is neither, and an empty one', async () => {
    const { roleForKey } = await posted()
    expect(roleForKey('guess')).toBeNull()
    expect(roleForKey('')).toBeNull()
  })

  /* A ministry running the desk single-handed sets one key. They are the
     reviewer, because the desk that must not be shut is the one that
     clears the queue. */
  it('makes the single key the reviewer when no review key is set', async () => {
    const { roleForKey } = await posted({ review: '' })
    expect(roleForKey(WRITE)).toBe('reviewer')
  })

  it('opens nothing when no key is configured', async () => {
    const { roleForKey } = await posted({ admin: '', review: '' })
    expect(roleForKey('')).toBeNull()
    expect(roleForKey('anything')).toBeNull()
  })
})

describe('the key behind a request, however it was presented', () => {
  async function resolve(
    init: RequestInit & { cookie?: string; bearer?: string; site?: string } = {}
  ) {
    vi.resetModules()
    vi.stubEnv('ADMIN_TOKEN', WRITE)
    vi.stubEnv('REVIEW_TOKEN', REVIEW)
    const { deskToken } = await import('@/lib/posted')
    const headers: Record<string, string> = {}
    if (init.cookie) headers.cookie = init.cookie
    if (init.bearer) headers.authorization = `Bearer ${init.bearer}`
    headers['sec-fetch-site'] = init.site ?? 'same-origin'
    return deskToken(new Request('https://read.test/api/articles', { method: 'POST', headers }))
  }

  async function cookieFor(role: 'writer' | 'reviewer') {
    const { mintSession } = await session()
    return `desk_session=${await mintSession(role, Date.now())}`
  }

  it('hands back the key a session stands for', async () => {
    expect(await resolve({ cookie: await cookieFor('reviewer') })).toBe(REVIEW)
    expect(await resolve({ cookie: await cookieFor('writer') })).toBe(WRITE)
  })

  /* Everything outside a browser — the public API, the examples in
     /docs/api — is untouched by any of this. */
  it('leaves a Bearer token exactly as it was given', async () => {
    expect(await resolve({ bearer: REVIEW })).toBe(REVIEW)
    expect(await resolve({ bearer: 'not-a-key' })).toBe('not-a-key')
  })

  it('prefers the Bearer token when both are present', async () => {
    expect(await resolve({ bearer: WRITE, cookie: await cookieFor('reviewer') })).toBe(WRITE)
  })

  /* The forgery cookie authentication invites: a hostile page causing the
     browser to send a write with the reader's own session attached. */
  it('ignores the cookie on a request another site caused', async () => {
    expect(await resolve({ cookie: await cookieFor('reviewer'), site: 'cross-site' })).toBe('')
  })

  it('hands back nothing when there is neither', async () => {
    expect(await resolve()).toBe('')
  })
})
