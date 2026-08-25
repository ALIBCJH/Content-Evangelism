import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Who wrote a piece.
 *
 * The byline was already stamped from the session rather than typed, so
 * the spelling could be trusted — but a spelling is not an identity. The
 * record carried a name and nothing else, which meant the site found an
 * author by looking for whoever spelled theirs the same way: fine until
 * two writers share a name, and quietly wrong the day somebody's name is
 * corrected and every piece they ever wrote stops being theirs.
 *
 * So a piece carries the writer's id beside the byline. What these hold
 * to is that the id is stamped and never accepted from the request, that
 * an edit cannot move a piece to somebody else, that a piece with an id
 * is matched by it alone, and that everything written before there were
 * ids still resolves by name.
 */

/* The routes flush the reader-facing cache on a write, which needs
   Next's request store. There is no request here — only the route. */
vi.mock('next/cache', () => ({ revalidatePath: () => {}, revalidateTag: () => {} }))

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

  const [writers, posted, session, articles, oneArticle] = await Promise.all([
    import('@/lib/writers'),
    import('@/lib/posted'),
    import('@/lib/desk-session'),
    import('@/app/api/articles/route'),
    import('@/app/api/articles/[slug]/route'),
  ])
  return { writers, posted, session, articles, oneArticle }
}

/** A writer on the register, and the cookie they would be carrying. */
async function signedIn(
  d: Awaited<ReturnType<typeof desk>>,
  name: string
): Promise<{ id: string; cookie: string }> {
  const added = await d.writers.addWriter({
    name,
    role: 'Devotional Editor',
    bio: 'Writes the morning portion and the quiet columns on prayer and waiting.',
  })
  const value = await d.session.mintSession(
    { role: 'writer', writer: added!.writer.id },
    Date.now()
  )
  return { id: added!.writer.id, cookie: `${d.session.DESK_COOKIE}=${value}` }
}

const PIECE = {
  title: 'On waiting for the morning',
  dek: 'A short teaching on the hours before dawn, and what they are for.',
  category: 'Teachings',
  body: 'The watchman waits for the morning, and so does the one who prays.',
}

function filed(body: Record<string, unknown>, headers: Record<string, string>) {
  return new Request('https://read.repentanceonline.com/api/articles', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...headers },
    body: JSON.stringify(body),
  })
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'attribution-'))
  await fs.mkdir(path.join(workspace, 'data'), { recursive: true })
  await fs.writeFile(path.join(workspace, 'data', 'articles.json'), '[]')
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  await fs.rm(workspace, { recursive: true, force: true })
})

describe('filing a piece while signed in', () => {
  it('stamps the writer’s id, not only their name', async () => {
    const d = await desk()
    const simon = await signedIn(d, 'Simon Juma')

    const response = await d.articles.POST(filed(PIECE, { cookie: simon.cookie }))
    expect(response.status).toBe(201)

    const [stored] = await d.posted.listPostedArticles({ includePending: true })
    expect(stored.authorName).toBe('Simon Juma')
    expect(stored.authorId).toBe(simon.id)
  })

  /* The same rule the byline already kept, one field along. A caller who
     could send an id could send anybody's. */
  it('ignores an id the request tried to send', async () => {
    const d = await desk()
    const simon = await signedIn(d, 'Simon Juma')
    await signedIn(d, 'Rev. Elizabeth Omondi')

    await d.articles.POST(
      filed(
        { ...PIECE, authorName: 'Rev. Elizabeth Omondi', authorId: 'elizabeth-omondi' },
        { cookie: simon.cookie }
      )
    )

    const [stored] = await d.posted.listPostedArticles({ includePending: true })
    expect(stored.authorName).toBe('Simon Juma')
    expect(stored.authorId).toBe(simon.id)
  })
})

describe('filing a piece with the ministry’s key', () => {
  /* The public API is a contract: a script posting for a named
     contributor must still be able to say so. But when that name is
     exactly somebody on the register, the record should say who they are
     rather than leave it to be guessed from the spelling later. */
  it('keeps the byline it sent, and links it when it names a writer', async () => {
    const d = await desk()
    const elizabeth = await signedIn(d, 'Rev. Elizabeth Omondi')

    await d.articles.POST(
      filed({ ...PIECE, authorName: 'Rev. Elizabeth Omondi' }, { authorization: `Bearer ${WRITE}` })
    )

    const [stored] = await d.posted.listPostedArticles({ includePending: true })
    expect(stored.authorName).toBe('Rev. Elizabeth Omondi')
    expect(stored.authorId).toBe(elizabeth.id)
  })

  it('leaves a byline that is nobody on the register without an id', async () => {
    const d = await desk()
    await d.articles.POST(
      filed({ ...PIECE, authorName: 'A Visiting Teacher' }, { authorization: `Bearer ${WRITE}` })
    )

    const [stored] = await d.posted.listPostedArticles({ includePending: true })
    expect(stored.authorName).toBe('A Visiting Teacher')
    expect(stored.authorId).toBeUndefined()
  })
})

describe('an edit', () => {
  it('cannot move a piece to somebody else', async () => {
    const d = await desk()
    const simon = await signedIn(d, 'Simon Juma')
    const elizabeth = await signedIn(d, 'Rev. Elizabeth Omondi')

    await d.articles.POST(filed(PIECE, { cookie: simon.cookie }))
    const [before] = await d.posted.listPostedArticles({ includePending: true })

    const edit = new Request(`https://read.repentanceonline.com/api/articles/${before.slug}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'sec-fetch-site': 'same-origin',
        cookie: elizabeth.cookie,
      },
      body: JSON.stringify({
        ...PIECE,
        body: 'The watchman waits, and the morning comes to those who kept the hours.',
        authorName: 'Rev. Elizabeth Omondi',
        authorId: elizabeth.id,
      }),
    })
    expect((await d.oneArticle.PUT(edit, { params: { slug: before.slug } })).status).toBe(200)

    const [after] = await d.posted.listPostedArticles({ includePending: true })
    expect(after.authorName).toBe('Simon Juma')
    expect(after.authorId).toBe(simon.id)
  })
})

describe('whose work a piece is', () => {
  it('is settled by the id alone when a piece carries one', async () => {
    const { posted } = await desk()
    const simon = { id: 'simon-juma', name: 'Simon Juma' }

    /* A matching name against somebody else's id is a coincidence, and
       the exact failure the id was added to close. */
    expect(posted.wroteIt({ authorId: 'simon-juma-2', authorName: 'Simon Juma' }, simon)).toBe(false)
    expect(posted.wroteIt({ authorId: 'simon-juma', authorName: 'S. Juma' }, simon)).toBe(true)
  })

  it('falls back to the byline for everything written before there were ids', async () => {
    const { posted } = await desk()
    const simon = { id: 'simon-juma', name: 'Simon Juma' }

    expect(posted.wroteIt({ authorName: 'Simon Juma' }, simon)).toBe(true)
    expect(posted.wroteIt({ authorName: 'Rev. Elizabeth Omondi' }, simon)).toBe(false)
  })
})

describe('a writer’s own desk', () => {
  it('shows their work and nobody else’s, by id', async () => {
    const d = await desk()
    const simon = await signedIn(d, 'Simon Juma')
    const elizabeth = await signedIn(d, 'Rev. Elizabeth Omondi')

    await d.articles.POST(filed(PIECE, { cookie: simon.cookie }))
    await d.articles.POST(
      filed({ ...PIECE, title: 'On the evening watch' }, { cookie: elizabeth.cookie })
    )

    const mine = new Request('https://read.repentanceonline.com/api/articles?mine=1', {
      headers: { 'sec-fetch-site': 'same-origin', cookie: simon.cookie },
    })
    const payload = await (await d.articles.GET(mine)).json()

    expect(payload.writer).toBe('Simon Juma')
    expect(payload.articles).toHaveLength(1)
    expect(payload.articles[0].authorId).toBe(simon.id)
  })
})
