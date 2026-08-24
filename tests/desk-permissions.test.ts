import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * What each desk key may actually do.
 *
 * The posting desk used to carry a Delete beside Edit on every published
 * teaching. Moving that button to the review desk is a change to a page;
 * this is the change to the rule behind it, and without the rule the
 * button was theatre — the endpoint is public, documented at /docs/api,
 * and answers to the posting key.
 *
 * The rule is the one the rest of the module keeps: the write key writes,
 * the review key decides what is on the site. Taking a teaching off the
 * site is deciding.
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

/** A store holding one live teaching and one still in the queue. */
async function given() {
  await fs.mkdir(path.join(workspace, 'data'), { recursive: true })
  await fs.writeFile(
    path.join(workspace, 'data', 'articles.json'),
    JSON.stringify([
      {
        slug: 'on-the-site',
        title: 'On the site',
        dek: 'A teaching a reader can reach.',
        category: 'Teachings',
        authorName: 'The Editorial Desk',
        body: 'x',
        publishedAt: '2026-08-01T00:00:00.000Z',
        readMinutes: 4,
        status: 'published',
      },
      {
        slug: 'in-the-queue',
        title: 'In the queue',
        dek: 'A teaching nobody has approved.',
        category: 'Teachings',
        authorName: 'The Editorial Desk',
        body: 'x',
        publishedAt: '2026-08-02T00:00:00.000Z',
        readMinutes: 4,
        status: 'pending',
      },
    ]),
    'utf8'
  )
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'desk-permissions-'))
  await given()
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  await fs.rm(workspace, { recursive: true, force: true })
})

describe('deleting a teaching that is on the site', () => {
  /* The one irreversible act at this ministry. Its address is out there,
     somebody may have shared it, and there is no undo. */
  it('is refused to the posting key', async () => {
    const { deletePostedArticle } = await desk()
    expect(await deletePostedArticle('on-the-site', WRITE)).toBe(403)
  })

  it('leaves the teaching exactly where it was', async () => {
    const { deletePostedArticle, getPostedArticle } = await desk()
    await deletePostedArticle('on-the-site', WRITE)
    expect(await getPostedArticle('on-the-site')).not.toBeNull()
  })

  it('is allowed to the review key', async () => {
    const { deletePostedArticle, getPostedArticle } = await desk()
    expect(await deletePostedArticle('on-the-site', REVIEW)).toBe(204)
    expect(await getPostedArticle('on-the-site')).toBeNull()
  })
})

describe('deleting a teaching still in the queue', () => {
  /* Not the same act. Nobody has read it, no address answers for it, and
     a writer abandoning their own unfinished piece should not need to
     find a senior reviewer to do it. */
  it('is allowed to the posting key', async () => {
    const { deletePostedArticle, getPostedArticle } = await desk()
    expect(await deletePostedArticle('in-the-queue', WRITE)).toBe(204)
    expect(await getPostedArticle('in-the-queue', { includePending: true })).toBeNull()
  })

  it('is allowed to the review key too', async () => {
    const { deletePostedArticle } = await desk()
    expect(await deletePostedArticle('in-the-queue', REVIEW)).toBe(204)
  })
})

describe('the answers that are not about permission', () => {
  it('refuses a key that is neither, before looking anything up', async () => {
    const { deletePostedArticle } = await desk()
    expect(await deletePostedArticle('on-the-site', 'not-a-key')).toBe(401)
    expect(await deletePostedArticle('never-existed', '')).toBe(401)
  })

  /* 404 before 403: a slug that does not exist is not a permission
     question, and answering 403 would tell a caller with the posting key
     which slugs are real. */
  it('says not-found for a slug that was never there', async () => {
    const { deletePostedArticle } = await desk()
    expect(await deletePostedArticle('never-existed', WRITE)).toBe(404)
    expect(await deletePostedArticle('never-existed', REVIEW)).toBe(404)
  })
})

describe('a deployment running the desk single-handed', () => {
  /* One key, which falls back to being the review key — so the ministry
     that has not set REVIEW_TOKEN is not locked out of removing its own
     work. The separation is what setting both buys. */
  it('may still delete what is on the site', async () => {
    vi.resetModules()
    vi.stubEnv('ADMIN_TOKEN', WRITE)
    vi.stubEnv('REVIEW_TOKEN', '')
    vi.stubEnv('KV_REST_API_URL', '')
    vi.stubEnv('KV_REST_API_TOKEN', '')
    vi.spyOn(process, 'cwd').mockReturnValue(workspace)
    const { deletePostedArticle } = await import('@/lib/posted')
    expect(await deletePostedArticle('on-the-site', WRITE)).toBe(204)
  })
})

describe('the endpoint says which key is wanted', () => {
  it('does not leave the caller guessing', async () => {
    vi.resetModules()
    vi.stubEnv('ADMIN_TOKEN', WRITE)
    vi.stubEnv('REVIEW_TOKEN', REVIEW)
    vi.stubEnv('KV_REST_API_URL', '')
    vi.stubEnv('KV_REST_API_TOKEN', '')
    vi.spyOn(process, 'cwd').mockReturnValue(workspace)
    const { DELETE } = await import('@/app/api/articles/[slug]/route')

    const response = await DELETE(
      new Request('https://read.test/api/articles/on-the-site', {
        method: 'DELETE',
        headers: { authorization: `Bearer ${WRITE}` },
      }),
      { params: { slug: 'on-the-site' } }
    )
    expect(response.status).toBe(403)
    expect((await response.json()).error).toContain('review key')
  })
})
