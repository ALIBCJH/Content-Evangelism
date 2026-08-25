import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EVERY_SECTION, narrow, uncheckedCount, type PieceRow } from '@/lib/desk-overview'

/**
 * Checking a teaching that was already on the site.
 *
 * The verified mark is set by approving, and approving is the door onto
 * the site — so every teaching published before there was a review desk
 * to publish it through carries no mark and cannot be given one. Twelve
 * of them sit on the site telling every reader "Not verified", with no
 * way for a reviewer to say otherwise.
 *
 * What is held to here is mostly what `verify` must NOT do. It is not an
 * edit of the teaching, and the date it was last changed is published to
 * search engines as `dateModified`; a reviewer reading a piece from March
 * has not rewritten it.
 */

const WRITE = 'posting-key-aaaaaaaaaaaaaaaaaaa'
const REVIEW = 'review-key-bbbbbbbbbbbbbbbbbbbb'

let workspace: string

async function desk() {
  vi.resetModules()
  vi.stubEnv('ADMIN_TOKEN', WRITE)
  vi.stubEnv('REVIEW_TOKEN', REVIEW)
  vi.stubEnv('KV_REST_API_URL', '')
  vi.stubEnv('KV_REST_API_TOKEN', '')
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
  vi.spyOn(process, 'cwd').mockReturnValue(workspace)
  return import('@/lib/posted')
}

const OLD = '2026-03-14T09:00:00.000Z'

/** One teaching live since March, from before the review desk existed. */
async function given(over: Record<string, unknown> = {}) {
  await fs.mkdir(path.join(workspace, 'data'), { recursive: true })
  await fs.writeFile(
    path.join(workspace, 'data', 'articles.json'),
    JSON.stringify([
      {
        slug: 'from-before',
        title: 'What is repentance and holiness?',
        dek: 'A teaching that predates the review desk.',
        category: 'Teachings',
        authorName: 'The Editorial Desk',
        body: 'x'.repeat(60),
        publishedAt: OLD,
        updatedAt: OLD,
        readMinutes: 9,
        ...over,
      },
    ])
  )
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'verify-'))
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  await fs.rm(workspace, { recursive: true, force: true })
})

describe('checking a teaching already on the site', () => {
  it('marks it checked', async () => {
    const { reviewArticle } = await desk()
    await given()
    const result = await reviewArticle('from-before', { action: 'verify' }, REVIEW)
    expect(result.status).toBe(200)
    expect(result.article?.verified).toBe(true)
  })

  /* The whole reason this is not just `approve`. `updatedAt` is published
     as `dateModified`; stamping today would tell every crawler the
     ministry had rewritten twelve teachings in an afternoon. */
  it('does not claim the teaching was edited today', async () => {
    const { reviewArticle } = await desk()
    await given()
    const result = await reviewArticle('from-before', { action: 'verify' }, REVIEW)
    expect(result.article?.updatedAt).toBe(OLD)
    expect(result.article?.publishedAt).toBe(OLD)
  })

  it('leaves the teaching itself alone', async () => {
    const { reviewArticle } = await desk()
    await given()
    const result = await reviewArticle('from-before', { action: 'verify' }, REVIEW)
    expect(result.article?.title).toBe('What is repentance and holiness?')
    expect(result.article?.body).toBe('x'.repeat(60))
    expect(result.article?.status).toBeUndefined()
  })

  it('is the review desk’s to do, not the writer’s', async () => {
    const { reviewArticle } = await desk()
    await given()
    expect((await reviewArticle('from-before', { action: 'verify' }, WRITE)).status).toBe(401)
  })

  /* A piece still in the queue has a door of its own, and it is approval.
     Verifying one would mark it checked while leaving it off the site. */
  it('refuses a teaching that is not on the site', async () => {
    const { reviewArticle } = await desk()
    await given({ status: 'pending' })
    const result = await reviewArticle('from-before', { action: 'verify' }, REVIEW)
    expect(result.status).toBe(409)
    expect(result.article).toBeUndefined()
  })

  it('says so for a slug nobody has', async () => {
    const { reviewArticle } = await desk()
    await given()
    expect((await reviewArticle('no-such-piece', { action: 'verify' }, REVIEW)).status).toBe(404)
  })
})

describe('the reviewer’s working list', () => {
  const row = (slug: string, over: Partial<PieceRow> = {}): PieceRow =>
    ({
      slug,
      title: slug,
      category: 'Teachings',
      authorName: 'The Editorial Desk',
      publishedAt: OLD,
      readMinutes: 9,
      status: 'published',
      verified: false,
      views: 0,
      seconds: 0,
      finished: 0,
      finishRate: 0,
      averageSeconds: 0,
      ...over,
    }) as PieceRow

  const rows = [
    row('unchecked-one'),
    row('unchecked-two', { category: 'Doctrine' }),
    row('checked', { verified: true }),
    row('in-the-queue', { status: 'pending' }),
  ]

  it('counts only what is live and unchecked', () => {
    /* A piece still in the queue is not on the site telling anybody it is
       unverified, so it is not on this list. */
    expect(uncheckedCount(rows)).toBe(2)
  })

  it('narrows to them', () => {
    const shown = narrow(rows, '', EVERY_SECTION, true).map((r) => r.slug)
    expect(shown).toEqual(['unchecked-one', 'unchecked-two'])
  })

  it('composes with the section, so one part can be worked through', () => {
    expect(narrow(rows, '', 'Doctrine', true).map((r) => r.slug)).toEqual(['unchecked-two'])
  })

  it('changes nothing when it is off', () => {
    expect(narrow(rows, '', EVERY_SECTION, false)).toHaveLength(4)
  })
})
