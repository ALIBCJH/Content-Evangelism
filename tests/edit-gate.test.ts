import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * What an edit may do to a teaching that is already on the site.
 *
 * The review desk decides what readers are shown. That was enforced on the
 * way in (a new piece is pending) and on the way out (deleting a live piece
 * needs the review key), and not at all in between: the posting key could
 * replace the entire body of an approved teaching, which went live at once,
 * kept the `verified` mark that says a reviewer read it, and kept the name
 * of the writer who did not write it.
 *
 * The rule is the one `deletePostedArticle` already keeps. Changing what is
 * on the site is deciding what is on the site. A writer may still edit —
 * being refused a typo fix would be its own kind of wrong — but the piece
 * goes back to the queue rather than changing under the reader.
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

const GRACE = { id: 'grace-wanjiru', name: 'Grace Wanjiru' }
const PETER = { id: 'peter-otieno', name: 'Peter Otieno' }

/** A live teaching of Grace's, and a draft of hers still in the queue. */
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
        authorName: 'Grace Wanjiru',
        authorId: 'grace-wanjiru',
        body: 'The body a reviewer read.',
        publishedAt: '2026-08-01T00:00:00.000Z',
        readMinutes: 4,
        status: 'published',
        verified: true,
      },
      {
        slug: 'in-the-queue',
        title: 'In the queue',
        dek: 'A teaching nobody has approved.',
        category: 'Teachings',
        authorName: 'Grace Wanjiru',
        authorId: 'grace-wanjiru',
        body: 'A draft, sent back once.',
        publishedAt: '2026-08-02T00:00:00.000Z',
        readMinutes: 4,
        status: 'pending',
        review: { note: 'Say where the passage is from.', at: '2026-08-03T00:00:00.000Z' },
      },
    ]),
    'utf8'
  )
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-gate-'))
  await given()
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  await fs.rm(workspace, { recursive: true, force: true })
})

const rewrite = { body: 'Text nobody senior has read.' }

describe('editing a teaching that is on the site', () => {
  it('takes it off the site rather than changing it under the reader', async () => {
    const { updatePostedArticle, getPostedArticle } = await desk()

    const result = await updatePostedArticle('on-the-site', rewrite, WRITE, GRACE)

    expect(result.status).toBe(200)
    expect(result.article?.status).toBe('pending')
    /* The whole point: the new text is not what a reader is served. */
    expect(await getPostedArticle('on-the-site')).toBeNull()
  })

  it('takes the reviewed mark off, because the text it applied to is gone', async () => {
    const { updatePostedArticle } = await desk()
    const result = await updatePostedArticle('on-the-site', rewrite, WRITE, GRACE)
    expect(result.article?.verified).toBeUndefined()
  })

  it('puts it back in the queue dated now, so the board sees it waiting', async () => {
    const { updatePostedArticle } = await desk()
    const result = await updatePostedArticle('on-the-site', rewrite, WRITE, GRACE)
    expect(result.article?.submittedAt).toBe(result.article?.updatedAt)
  })

  it('keeps the byline, because an edit is not a change of authorship', async () => {
    const { updatePostedArticle } = await desk()
    const result = await updatePostedArticle('on-the-site', rewrite, WRITE, GRACE)
    expect(result.article?.authorName).toBe('Grace Wanjiru')
    expect(result.article?.authorId).toBe('grace-wanjiru')
  })

  it('leaves it on the site when the reviewer is the one editing', async () => {
    const { updatePostedArticle, getPostedArticle } = await desk()

    const result = await updatePostedArticle('on-the-site', rewrite, REVIEW, null)

    expect(result.article?.status).toBe('published')
    expect(result.article?.verified).toBe(true)
    expect((await getPostedArticle('on-the-site'))?.body).toBe(rewrite.body)
  })

  it('holds the ministry’s own posting key to the same rule', async () => {
    /* No editor: a Bearer token is the ministry rather than a person. It
       keeps its blanket authority over whose work it may touch, and not
       the authority to change what is on the site. */
    const { updatePostedArticle } = await desk()
    const result = await updatePostedArticle('on-the-site', rewrite, WRITE, null)
    expect(result.article?.status).toBe('pending')
  })
})

describe('editing a teaching still in the queue', () => {
  it('leaves it where it was, because nothing about it was on the site', async () => {
    const { updatePostedArticle } = await desk()
    const result = await updatePostedArticle('in-the-queue', rewrite, WRITE, GRACE)
    expect(result.status).toBe(200)
    expect(result.article?.status).toBe('pending')
  })

  it('keeps the reviewer’s note, which the writer is still working against', async () => {
    /* The note is not cleared by an edit. It is what the writer is reading
       while they fix the piece, and what tells the reviewer why it is in
       front of them again; approving is what answers it and removes it. */
    const { updatePostedArticle } = await desk()
    const result = await updatePostedArticle('in-the-queue', rewrite, WRITE, GRACE)
    expect(result.article?.review?.note).toBe('Say where the passage is from.')
  })
})

describe('whose work a writer may edit', () => {
  it('refuses another writer’s draft, note and all', async () => {
    const { updatePostedArticle, listPostedArticles } = await desk()

    const result = await updatePostedArticle('in-the-queue', rewrite, WRITE, PETER)

    expect(result.status).toBe(403)
    const held = (await listPostedArticles({ includePending: true })).find(
      (a) => a.slug === 'in-the-queue'
    )
    expect(held?.body).toBe('A draft, sent back once.')
  })

  it('refuses another writer’s published teaching too', async () => {
    const { updatePostedArticle } = await desk()
    const result = await updatePostedArticle('on-the-site', rewrite, WRITE, PETER)
    expect(result.status).toBe(403)
  })

  it('lets a reviewer edit anybody’s, which is the job', async () => {
    const { updatePostedArticle } = await desk()
    const result = await updatePostedArticle('in-the-queue', rewrite, REVIEW, PETER)
    expect(result.status).toBe(200)
  })

  it('says whose it is rather than pretending the slug is wrong', async () => {
    /* 403, not 404. The piece exists and the key is genuine; sending a
       writer to hunt for a typo in a correct slug helps nobody. */
    const { updatePostedArticle } = await desk()
    const result = await updatePostedArticle('in-the-queue', rewrite, WRITE, PETER)
    expect(result.error).toMatch(/another writer/i)
  })

  it('still refuses a key that is neither, before looking anything up', async () => {
    const { updatePostedArticle } = await desk()
    const result = await updatePostedArticle('in-the-queue', rewrite, 'guess', GRACE)
    expect(result.status).toBe(401)
  })
})
