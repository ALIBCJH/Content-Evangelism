import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * The gate itself: who is turned away, and where they are sent.
 *
 * The desk used to render in full to anybody who typed the address — the
 * queue, every teaching on the site, the readers' questions — and then
 * ask for a key to unlock the buttons. These are the tests that say the
 * room is no longer open.
 */

const WRITE = 'posting-key-aaaaaaaaaaaaaaaaaaa'
const REVIEW = 'review-key-bbbbbbbbbbbbbbbbbbbb'

async function gate() {
  vi.resetModules()
  vi.stubEnv('ADMIN_TOKEN', WRITE)
  vi.stubEnv('REVIEW_TOKEN', REVIEW)
  const [{ middleware }, session, { NextRequest }] = await Promise.all([
    import('@/middleware'),
    import('@/lib/desk-session'),
    import('next/server'),
  ])

  const ask = async (path: string, role?: 'writer' | 'reviewer') => {
    const headers = new Headers()
    if (role) {
      const cookie = await session.mintSession(role, Date.now())
      headers.set('cookie', `${session.DESK_COOKIE}=${cookie}`)
    }
    const response = await middleware(new NextRequest(new URL(`https://read.test${path}`), { headers }))
    const location = response.headers.get('location')
    return {
      sentTo: location ? new URL(location).pathname : null,
      query: location ? new URL(location).searchParams : null,
      passed: !location,
    }
  }

  return { ask, session }
}

afterEach(() => vi.unstubAllEnvs())

describe('arriving with no session', () => {
  it('turns away every desk', async () => {
    const { ask } = await gate()
    for (const path of ['/admin', '/admin/review', '/admin/questions', '/admin/insight']) {
      const result = await ask(path)
      expect(result.passed, path).toBe(false)
      expect(result.sentTo).toBe('/admin/login')
    }
  })

  it('remembers where they were going', async () => {
    const { ask } = await gate()
    expect((await ask('/admin/questions')).query?.get('from')).toBe('/admin/questions')
  })

  /* The front of the desk is where the door leads anyway. */
  it('does not bother carrying /admin back', async () => {
    const { ask } = await gate()
    expect((await ask('/admin')).query?.get('from')).toBeNull()
  })

  it('lets the door itself through', async () => {
    const { ask } = await gate()
    expect((await ask('/admin/login')).passed).toBe(true)
  })
})

describe('arriving with a session', () => {
  it('lets a writer into the writing desks', async () => {
    const { ask } = await gate()
    for (const path of ['/admin', '/admin/questions', '/admin/insight']) {
      expect((await ask(path, 'writer')).passed, path).toBe(true)
    }
  })

  it('lets a reviewer everywhere', async () => {
    const { ask } = await gate()
    for (const path of ['/admin', '/admin/review', '/admin/questions', '/admin/insight']) {
      expect((await ask(path, 'reviewer')).passed, path).toBe(true)
    }
  })

  /* The whole point of two keys. A writer may write and submit; what goes
     on the site is somebody else's to say. */
  it('keeps a writer out of the review desk, and says why', async () => {
    const { ask } = await gate()
    const result = await ask('/admin/review', 'writer')
    expect(result.passed).toBe(false)
    expect(result.sentTo).toBe('/admin/login')
    expect(result.query?.get('need')).toBe('review')
    expect(result.query?.get('from')).toBe('/admin/review')
  })
})

describe('where the door sends you afterwards', () => {
  async function safe() {
    vi.resetModules()
    const { safeDeskReturn } = await import('@/lib/desk-session')
    return safeDeskReturn
  }

  it('keeps a path at this desk', async () => {
    const safeDeskReturn = await safe()
    expect(safeDeskReturn('/admin/review')).toBe('/admin/review')
    expect(safeDeskReturn('/admin')).toBe('/admin')
    expect(safeDeskReturn('/admin/questions?filter=new')).toBe('/admin/questions?filter=new')
  })

  /* An open redirect is how a correct sign-in lands somebody on a copy of
     this desk that asks for the key again. */
  it('refuses to be pointed at another site', async () => {
    const safeDeskReturn = await safe()
    for (const hostile of [
      'https://not-the-ministry.example',
      '//not-the-ministry.example',
      '/\\not-the-ministry.example',
      'javascript:alert(1)',
      '/adminsomething-else',
      '/',
      '',
      undefined,
      42,
    ]) {
      expect(safeDeskReturn(hostile), String(hostile)).toBe('/admin')
    }
  })
})
