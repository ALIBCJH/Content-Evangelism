import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  EVERY_SECTION,
  narrow,
  needsAttention,
  withoutPicture,
  type PieceRow,
} from '@/lib/desk-overview'

/**
 * A teaching waits until it has a picture.
 *
 * The site draws a generated field for a teaching with no artwork — a
 * coloured band belonging to its section rather than to it — so every
 * piece in Teachings wears the same one and a reader scanning a listing
 * is given nothing to tell them apart. The ministry's rule is that such a
 * teaching is not on the site.
 *
 * Two halves are held to here. The rule itself, kept at the one door onto
 * the site; and the thing that had to be fixed before the rule could be
 * obeyed at all — that eleven of the thirteen teachings on this site are
 * files the repository carries, and every write in the store looked in
 * the store and only the store, so the desk's Unpublish button answered
 * 404 for them.
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

function teaching(slug: string, over: Record<string, unknown> = {}) {
  return {
    slug,
    title: `Teaching ${slug}`,
    dek: 'A teaching from before the picture rule.',
    category: 'Teachings',
    authorName: 'The Editorial Desk',
    body: 'x'.repeat(60),
    publishedAt: OLD,
    updatedAt: OLD,
    readMinutes: 9,
    ...over,
  }
}

/** Records at the desk, in data/articles.json. */
async function stored(...articles: Record<string, unknown>[]) {
  await fs.mkdir(path.join(workspace, 'data'), { recursive: true })
  await fs.writeFile(path.join(workspace, 'data', 'articles.json'), JSON.stringify(articles))
}

/** Teachings the repository itself carries, in content/articles. */
async function carried(...articles: Record<string, unknown>[]) {
  const dir = path.join(workspace, 'content', 'articles')
  await fs.mkdir(dir, { recursive: true })
  for (const article of articles) {
    await fs.writeFile(path.join(dir, `${article.slug}.json`), JSON.stringify(article))
  }
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'picture-'))
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  await fs.rm(workspace, { recursive: true, force: true })
})

describe('what counts as having a picture', () => {
  it('accepts the poster, the landscape crop, or both', async () => {
    const { hasPicture } = await desk()
    expect(hasPicture({ imageUrl: '/images/a.webp' })).toBe(true)
    expect(hasPicture({ thumbnailUrl: '/images/a-wide.webp' })).toBe(true)
    expect(hasPicture({ imageUrl: '/images/a.webp', thumbnailUrl: '/images/a-wide.webp' })).toBe(
      true
    )
  })

  it('is not fooled by an empty string', async () => {
    const { hasPicture } = await desk()
    expect(hasPicture({})).toBe(false)
    expect(hasPicture({ imageUrl: '', thumbnailUrl: '' })).toBe(false)
  })
})

describe('the door onto the site', () => {
  it('refuses to approve a teaching with no picture', async () => {
    const { reviewArticle } = await desk()
    await stored(teaching('plain', { status: 'pending' }))

    const result = await reviewArticle('plain', { action: 'approve' }, REVIEW)
    expect(result.status).toBe(409)
    expect(result.article).toBeUndefined()
    /* The message has to name the fix, or a reviewer is left with a
       button that does nothing and no idea what to do about it. */
    expect(result.error).toContain('picture')
  })

  it('leaves it in the queue rather than half-approving it', async () => {
    const { getPostedArticle, reviewArticle } = await desk()
    await stored(teaching('plain', { status: 'pending' }))

    await reviewArticle('plain', { action: 'approve' }, REVIEW)
    const held = await getPostedArticle('plain', { includePending: true })
    expect(held?.status).toBe('pending')
    expect(held?.verified).toBeUndefined()
  })

  it('approves one that has a picture', async () => {
    const { reviewArticle } = await desk()
    await stored(
      teaching('with-art', { status: 'pending', imageUrl: '/images/a.webp', imageAlt: 'A field' })
    )

    const result = await reviewArticle('with-art', { action: 'approve' }, REVIEW)
    expect(result.status).toBe(200)
    expect(result.article?.status).toBe('published')
    expect(result.article?.verified).toBe(true)
  })

  /* The landscape crop alone is a picture. A teaching may carry only the
     wide cut — nothing else on the site requires the poster. */
  it('accepts a landscape crop on its own', async () => {
    const { reviewArticle } = await desk()
    await stored(teaching('wide-only', { status: 'pending', thumbnailUrl: '/images/a-wide.webp' }))
    expect((await reviewArticle('wide-only', { action: 'approve' }, REVIEW)).status).toBe(200)
  })

  /* Taking one off the site is not approving it, and must not be caught
     by the rule — it is the whole point of the rule. */
  it('does not stop a pictureless teaching being taken down', async () => {
    const { reviewArticle } = await desk()
    await stored(teaching('plain'))
    const result = await reviewArticle('plain', { action: 'unpublish' }, REVIEW)
    expect(result.status).toBe(200)
    expect(result.article?.status).toBe('pending')
  })
})

describe('a teaching the repository carries', () => {
  it('can be taken off the site', async () => {
    const { getPostedArticle, listPostedArticles, reviewArticle } = await desk()
    await carried(teaching('from-the-repo'))

    /* It is live to begin with — no status means published, which is what
       keeps every teaching written before the review desk on the site. */
    expect((await listPostedArticles()).map((a) => a.slug)).toContain('from-the-repo')

    const result = await reviewArticle('from-the-repo', { action: 'unpublish' }, REVIEW)
    expect(result.status).toBe(200)
    expect(result.article?.status).toBe('pending')

    expect((await listPostedArticles()).map((a) => a.slug)).not.toContain('from-the-repo')
    expect(await getPostedArticle('from-the-repo')).toBeNull()
  })

  it('keeps its writing when the desk overlays it', async () => {
    const { getPostedArticle, reviewArticle } = await desk()
    await carried(teaching('from-the-repo'))

    await reviewArticle('from-the-repo', { action: 'unpublish' }, REVIEW)
    const held = await getPostedArticle('from-the-repo', { includePending: true })
    expect(held?.title).toBe('Teaching from-the-repo')
    expect(held?.body).toBe('x'.repeat(60))
    expect(held?.publishedAt).toBe(OLD)
  })

  it('appears once, not twice, once the desk holds a copy', async () => {
    const { listPostedArticles, reviewArticle } = await desk()
    await carried(teaching('from-the-repo'))

    await reviewArticle('from-the-repo', { action: 'unpublish' }, REVIEW)
    const all = await listPostedArticles({ includePending: true })
    expect(all.filter((a) => a.slug === 'from-the-repo')).toHaveLength(1)
  })

  it('can be given a picture at the desk', async () => {
    const { getPostedArticle, updatePostedArticle } = await desk()
    await carried(teaching('from-the-repo'))

    const result = await updatePostedArticle(
      'from-the-repo',
      { imageUrl: '/images/a.webp', imageAlt: 'A field' },
      REVIEW
    )
    expect(result.status).toBe(200)
    expect((await getPostedArticle('from-the-repo'))?.imageUrl).toBe('/images/a.webp')
  })

  /* The round trip the rule depends on: take it off, give it a picture,
     put it back. If any leg of this 404s the desk has a one-way door. */
  it('can be taken off, given a picture and put back', async () => {
    const { getPostedArticle, reviewArticle, updatePostedArticle } = await desk()
    await carried(teaching('from-the-repo'))

    expect((await reviewArticle('from-the-repo', { action: 'unpublish' }, REVIEW)).status).toBe(200)
    expect(
      (await updatePostedArticle('from-the-repo', { imageUrl: '/images/a.webp' }, REVIEW)).status
    ).toBe(200)
    expect((await reviewArticle('from-the-repo', { action: 'approve' }, REVIEW)).status).toBe(200)

    const back = await getPostedArticle('from-the-repo')
    expect(back?.imageUrl).toBe('/images/a.webp')
    expect(back?.verified).toBe(true)
  })

  it('still says 404 for a slug nobody has', async () => {
    const { reviewArticle, updatePostedArticle } = await desk()
    await carried(teaching('from-the-repo'))
    expect((await reviewArticle('no-such-thing', { action: 'unpublish' }, REVIEW)).status).toBe(404)
    expect((await updatePostedArticle('no-such-thing', { body: 'x' }, REVIEW)).status).toBe(404)
  })

  /* Deleting the desk's copy would remove the overlay and leave the file
     underneath it — so a reviewer who had just taken a teaching off the
     site could delete it and watch it come back, live, at the same
     address. */
  it('cannot be deleted into coming back', async () => {
    const { deletePostedArticle, listPostedArticles, reviewArticle } = await desk()
    await carried(teaching('from-the-repo'))
    await reviewArticle('from-the-repo', { action: 'unpublish' }, REVIEW)

    expect(await deletePostedArticle('from-the-repo', REVIEW)).toBe(409)
    expect((await listPostedArticles()).map((a) => a.slug)).not.toContain('from-the-repo')
  })

  it('is still the review desk’s decision, not the writer’s', async () => {
    const { reviewArticle } = await desk()
    await carried(teaching('from-the-repo'))
    expect((await reviewArticle('from-the-repo', { action: 'unpublish' }, WRITE)).status).toBe(401)
  })

  /* A writer may fix their own sentence in a repository teaching, and the
     store's existing rule then applies: an edit by somebody who cannot
     approve sends it back to the queue. */
  it('goes back to the queue when somebody who cannot approve edits it', async () => {
    const { getPostedArticle, updatePostedArticle } = await desk()
    await carried(teaching('from-the-repo', { verified: true }))

    const result = await updatePostedArticle('from-the-repo', { body: 'y'.repeat(60) }, WRITE)
    expect(result.status).toBe(200)
    const held = await getPostedArticle('from-the-repo', { includePending: true })
    expect(held?.status).toBe('pending')
    expect(held?.verified).toBeUndefined()
  })
})

/**
 * The way back onto the site.
 *
 * A rule that takes a teaching down is only half a rule if the teaching
 * cannot then be opened and given the thing it was taken down for. The
 * review desk's link to the posting desk names the piece in the address,
 * and the form on the other end has to be filled from it — which was a
 * read of an article the store was hiding, because it was now pending.
 */
describe('reading a teaching that is off the site', () => {
  async function route() {
    vi.resetModules()
    vi.stubEnv('ADMIN_TOKEN', WRITE)
    vi.stubEnv('REVIEW_TOKEN', REVIEW)
    vi.stubEnv('KV_REST_API_URL', '')
    vi.stubEnv('KV_REST_API_TOKEN', '')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    vi.spyOn(process, 'cwd').mockReturnValue(workspace)
    const { GET } = await import('@/app/api/articles/[slug]/route')
    return (slug: string, key?: string) =>
      GET(
        new Request(`https://read.test/api/articles/${slug}`, {
          headers: key ? { authorization: `Bearer ${key}` } : {},
        }),
        { params: { slug } }
      )
  }

  it('hands it to a reviewer', async () => {
    const ask = await route()
    await stored(teaching('held', { status: 'pending' }))
    const response = await ask('held', REVIEW)
    expect(response.status).toBe(200)
    expect((await response.json()).article.slug).toBe('held')
  })

  /* A reviewer's reason for sending a piece back is between them and the
     person who wrote it, so the posting key — which is the ministry
     rather than any writer — is not shown somebody else's queue. */
  it('does not hand it to the posting key', async () => {
    const ask = await route()
    await stored(teaching('held', { status: 'pending' }))
    expect((await ask('held', WRITE)).status).toBe(404)
  })

  it('does not hand it to a reader', async () => {
    const ask = await route()
    await stored(teaching('held', { status: 'pending' }))
    expect((await ask('held')).status).toBe(404)
  })

  it('still hands a live teaching to anybody', async () => {
    const ask = await route()
    await stored(teaching('on-the-site'))
    expect((await ask('on-the-site')).status).toBe(200)
  })

  it('is still 404 for a slug nobody has', async () => {
    const ask = await route()
    await stored(teaching('held'))
    expect((await ask('no-such-thing', REVIEW)).status).toBe(404)
  })
})

/* ── The board ────────────────────────────────────────────────────── */

const row = (slug: string, over: Partial<PieceRow> = {}): PieceRow =>
  ({
    slug,
    title: slug,
    category: 'Teachings',
    authorName: 'The Editorial Desk',
    publishedAt: OLD,
    readMinutes: 9,
    status: 'published',
    hasPicture: false,
    path: `/articles/${slug}`,
    views: 0,
    seconds: 0,
    finished: 0,
    finishRate: 0,
    averageSeconds: 0,
    viewsEver: 0,
    sections: [],
    ...over,
  }) as PieceRow

describe('what the desk is shown', () => {
  it('counts the live teachings with no picture', () => {
    const needs = needsAttention(
      [
        { ...row('a'), hasPicture: false },
        { ...row('b'), hasPicture: true },
        { ...row('c'), hasPicture: false, status: 'pending' },
      ],
      []
    )
    expect(needs.pictureless).toBe(1)
  })

  it('lists them oldest first', () => {
    const rows = withoutPicture([
      row('newer', { publishedAt: '2026-06-01T00:00:00.000Z' }),
      row('older', { publishedAt: '2026-01-01T00:00:00.000Z' }),
      row('has-art', { hasPicture: true }),
      row('already-off', { status: 'pending' }),
    ])
    expect(rows.map((r) => r.slug)).toEqual(['older', 'newer'])
  })

  it('narrows the table to them, and composes with the section filter', () => {
    const rows = [
      row('a'),
      row('b', { hasPicture: true }),
      row('c', { category: 'Prophecy' }),
      row('d', { status: 'pending' }),
    ]
    expect(narrow(rows, '', EVERY_SECTION, false, true).map((r) => r.slug)).toEqual(['a', 'c'])
    expect(narrow(rows, '', 'Prophecy', false, true).map((r) => r.slug)).toEqual(['c'])
  })

  it('leaves the table alone when the filter is off', () => {
    const rows = [row('a'), row('b', { hasPicture: true })]
    expect(narrow(rows, '', EVERY_SECTION, false).map((r) => r.slug)).toEqual(['a', 'b'])
  })
})
