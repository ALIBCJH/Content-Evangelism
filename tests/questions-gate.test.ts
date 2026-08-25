import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Who may read the question box, and who may answer out of it in public.
 *
 * The queue asked for either desk key. That was the right answer while a
 * desk key meant the ministry, and the wrong one from the moment the
 * register turned "whoever holds a key" into a list of people: a question
 * carries a reader's name, their email address, and whatever somebody in
 * trouble decided to write, and adding a contributor should not hand them
 * the ministry's correspondence.
 *
 * Publishing an answer is the same act as approving a teaching — words on
 * the open site under the ministry's name — reached through a different
 * door, and it answers to the same key.
 */

const WRITE = 'posting-key-aaaaaaaaaaaaaaaaaaa'
const REVIEW = 'review-key-bbbbbbbbbbbbbbbbbbbb'

let workspace: string

async function box() {
  vi.resetModules()
  vi.stubEnv('ADMIN_TOKEN', WRITE)
  vi.stubEnv('REVIEW_TOKEN', REVIEW)
  vi.stubEnv('KV_REST_API_URL', '')
  vi.stubEnv('KV_REST_API_TOKEN', '')
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
  vi.spyOn(process, 'cwd').mockReturnValue(workspace)
  return import('@/lib/questions')
}

async function given() {
  await fs.mkdir(path.join(workspace, 'data'), { recursive: true })
  await fs.writeFile(
    path.join(workspace, 'data', 'questions.json'),
    JSON.stringify([
      {
        id: 'q1',
        body: 'My marriage is failing and I do not know how to pray.',
        name: 'Mary',
        email: 'mary@example.com',
        askedAt: '2026-08-20T00:00:00.000Z',
        status: 'new',
      },
    ]),
    'utf8'
  )
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'questions-gate-'))
  await given()
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  await fs.rm(workspace, { recursive: true, force: true })
})

const ANSWER = {
  question: 'How should I pray when a marriage is failing?',
  answer: 'The desk answers at length, and the answer is published in the open for others.',
}

describe('reading the queue', () => {
  it('is refused to the posting key, because these are readers’ words', async () => {
    const { listQuestions } = await box()
    const listed = await listQuestions(WRITE)
    expect(listed.status).toBe(401)
    expect(listed.questions).toBeUndefined()
  })

  it('is open to the review key', async () => {
    const { listQuestions } = await box()
    const listed = await listQuestions(REVIEW)
    expect(listed.questions).toHaveLength(1)
  })

  it('never hands an email address to a key that may not read it', async () => {
    const { listQuestions } = await box()
    expect(JSON.stringify(await listQuestions(WRITE))).not.toContain('mary@example.com')
  })
})

describe('answering in the open', () => {
  it('is refused to the posting key', async () => {
    const { updateQuestion, listQuestions } = await box()

    const result = await updateQuestion('q1', { published: ANSWER }, WRITE)

    expect(result.status).toBe(403)
    const held = (await listQuestions(REVIEW)).questions?.[0]
    expect(held?.published).toBeUndefined()
  })

  it('is allowed to the review key', async () => {
    const { updateQuestion } = await box()
    const result = await updateQuestion('q1', { published: ANSWER }, REVIEW)
    expect(result.status).toBe(200)
    expect(result.question?.published?.slug).toBeTruthy()
  })

  it('refuses the posting key a takedown as well, which is the same decision', async () => {
    const { updateQuestion } = await box()
    await updateQuestion('q1', { published: ANSWER }, REVIEW)
    const result = await updateQuestion('q1', { published: null }, WRITE)
    expect(result.status).toBe(403)
  })

  it('says which key is wanted rather than leaving the desk guessing', async () => {
    const { updateQuestion } = await box()
    const result = await updateQuestion('q1', { published: ANSWER }, WRITE)
    expect(result.error).toMatch(/review key/i)
  })
})

describe('the desk work that is not publishing', () => {
  it('lets the posting key move a question along the queue', async () => {
    const { updateQuestion } = await box()
    const result = await updateQuestion('q1', { status: 'answered' }, WRITE)
    expect(result.status).toBe(200)
    expect(result.question?.status).toBe('answered')
  })

  it('lets the posting key note something on it', async () => {
    const { updateQuestion } = await box()
    const result = await updateQuestion('q1', { note: 'Passed to the pastoral desk.' }, WRITE)
    expect(result.question?.note).toBe('Passed to the pastoral desk.')
  })

  it('still refuses a key that is neither', async () => {
    const { updateQuestion } = await box()
    expect((await updateQuestion('q1', { status: 'answered' }, 'guess')).status).toBe(401)
  })
})

describe('deleting a reader’s question', () => {
  it('is refused to the posting key: it cannot be undone and there is no copy', async () => {
    const { deleteQuestion, listQuestions } = await box()
    expect(await deleteQuestion('q1', WRITE)).toBe(401)
    expect((await listQuestions(REVIEW)).questions).toHaveLength(1)
  })

  it('is allowed to the review key', async () => {
    const { deleteQuestion } = await box()
    expect(await deleteQuestion('q1', REVIEW)).toBe(204)
  })
})

describe('a deployment running the desk single-handed', () => {
  it('opens the queue with the one key it has', async () => {
    /* No REVIEW_TOKEN: reviewKey() falls back to the posting key, so a
       ministry with one key is not locked out of its own readers. */
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'questions-single-'))
    await given()
    vi.resetModules()
    vi.stubEnv('ADMIN_TOKEN', WRITE)
    vi.stubEnv('REVIEW_TOKEN', '')
    vi.spyOn(process, 'cwd').mockReturnValue(workspace)
    const { listQuestions, updateQuestion } = await import('@/lib/questions')

    expect((await listQuestions(WRITE)).questions).toHaveLength(1)
    expect((await updateQuestion('q1', { published: ANSWER }, WRITE)).status).toBe(200)
  })
})
