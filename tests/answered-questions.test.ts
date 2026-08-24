import { promises as fs } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  answerBySlug,
  askQuestion,
  listAnswers,
  listQuestions,
  updateQuestion,
  validateAnswer,
} from '@/lib/questions'

/**
 * Answering a reader in the open.
 *
 * Two things are being guarded here, and the second is the one that would
 * matter at three in the morning. The first is that a page keeps its
 * address: somebody shares /questions/what-is-repentance, the desk fixes
 * a typo in the wording, and the link they shared still opens. The second
 * is that what a reader typed — their words, their name, the address they
 * gave so somebody would write back — cannot reach a public page by any
 * route this module offers.
 *
 * It runs against the real file store, which is where a development
 * deployment keeps its queue, and puts back whatever was there before.
 */

const STORE = path.join(process.cwd(), 'data', 'questions.json')
const KEY = 'test-token-for-questions'
let existing: string | null = null

beforeAll(async () => {
  existing = await fs.readFile(STORE, 'utf8').catch(() => null)
  process.env.ADMIN_TOKEN = KEY
})

afterAll(async () => {
  if (existing === null) await fs.rm(STORE, { force: true })
  else await fs.writeFile(STORE, existing, 'utf8')
})

beforeEach(async () => {
  await fs.mkdir(path.dirname(STORE), { recursive: true })
  await fs.writeFile(STORE, '[]\n', 'utf8')
})

/** A reader asks something, and the desk gets its id. */
async function asked(body: string, extra: { name?: string; email?: string } = {}) {
  const result = await askQuestion({
    body,
    fromPath: '/articles/what-is-repentance-and-holiness',
    fromTitle: 'What is repentance and holiness?',
    ...extra,
  })
  return result.question!
}

const ANSWER = 'Repentance is turning from sin and turning back to God.\n\nIt is not a feeling.'

describe('publishing an answer', () => {
  it('gives the pair its own address, made from the question', async () => {
    const question = await asked('I keep hearing about repentance. What does it actually mean?')
    await updateQuestion(
      question.id,
      { published: { question: 'What does repentance actually mean?', answer: ANSWER } },
      KEY
    )

    const answers = await listAnswers()
    expect(answers).toHaveLength(1)
    expect(answers[0].slug).toBe('what-does-repentance-actually-mean')
    expect(answers[0].question).toBe('What does repentance actually mean?')
    expect(await answerBySlug(answers[0].slug)).toBeTruthy()
  })

  it('keeps the address when the desk rewords the question', async () => {
    const question = await asked('I keep hearing about repentance. What does it actually mean?')
    await updateQuestion(
      question.id,
      { published: { question: 'What does repentance actually mean?', answer: ANSWER } },
      KEY
    )
    await updateQuestion(
      question.id,
      { published: { question: 'What does repentance mean, exactly?', answer: ANSWER } },
      KEY
    )

    const answers = await listAnswers()
    expect(answers).toHaveLength(1)
    /* The wording moved; the link somebody shared did not. */
    expect(answers[0].slug).toBe('what-does-repentance-actually-mean')
    expect(answers[0].question).toBe('What does repentance mean, exactly?')
  })

  it('keeps the date it first went up', async () => {
    const question = await asked('A question about the rapture and the second coming, at length.')
    await updateQuestion(
      question.id,
      { published: { question: 'Is the rapture the same as the second coming?', answer: ANSWER } },
      KEY
    )
    const first = (await listAnswers())[0].publishedAt

    await updateQuestion(
      question.id,
      { published: { question: 'Is the rapture the second coming?', answer: `${ANSWER} More.` } },
      KEY
    )
    expect((await listAnswers())[0].publishedAt).toBe(first)
  })

  it('never lets two pages share one address', async () => {
    const first = await asked('The first reader asks about holiness in some detail here.')
    const second = await asked('The second reader asks the very same thing in other words.')
    for (const question of [first, second]) {
      await updateQuestion(
        question.id,
        { published: { question: 'What is holiness?', answer: ANSWER } },
        KEY
      )
    }

    const slugs = (await listAnswers()).map((answer) => answer.slug)
    expect(new Set(slugs).size).toBe(2)
    expect(slugs).toContain('what-is-holiness')
  })

  it('marks the question answered, without being asked to', async () => {
    const question = await asked('Something a reader wants to know about the ministry.')
    await updateQuestion(
      question.id,
      { published: { question: 'A question worth publishing', answer: ANSWER } },
      KEY
    )

    const queue = await listQuestions(KEY)
    expect(queue.questions?.[0].status).toBe('answered')
  })

  it('takes a page down and leaves the question in the queue', async () => {
    const question = await asked('Something a reader wants to know about the ministry.')
    await updateQuestion(
      question.id,
      { published: { question: 'A question worth publishing', answer: ANSWER } },
      KEY
    )
    await updateQuestion(question.id, { published: null }, KEY)

    expect(await listAnswers()).toHaveLength(0)
    expect(await answerBySlug('a-question-worth-publishing')).toBeUndefined()
    expect((await listQuestions(KEY)).questions).toHaveLength(1)
  })

  it('refuses to publish without the posting key', async () => {
    const question = await asked('Something a reader wants to know about the ministry.')
    const result = await updateQuestion(
      question.id,
      { published: { question: 'A question worth publishing', answer: ANSWER } },
      'not-the-key'
    )

    expect(result.status).toBe(401)
    expect(await listAnswers()).toHaveLength(0)
  })
})

describe('what a published page can never carry', () => {
  it('publishes the desk’s wording, never the reader’s own words', async () => {
    const readers = 'My name is Jane and my number is 0722 000000, please tell me about holiness.'
    const question = await asked(readers, { name: 'Jane Doe', email: 'jane@example.com' })
    await updateQuestion(
      question.id,
      { published: { question: 'What is holiness?', answer: ANSWER } },
      KEY
    )

    const published = JSON.stringify(await listAnswers())
    expect(published).not.toContain(readers)
    expect(published).not.toContain('Jane')
    expect(published).not.toContain('jane@example.com')
    expect(published).not.toContain('0722')
    /* Nor the page they were on, nor any id back to the queue. */
    expect(published).not.toContain('/articles/what-is-repentance-and-holiness')
    expect(published).not.toContain(question.id)
  })

  it('carries only the four fields a page is built from', async () => {
    const question = await asked('A reader asking something worth answering in the open.')
    await updateQuestion(
      question.id,
      { published: { question: 'What is holiness?', answer: ANSWER } },
      KEY
    )

    expect(Object.keys((await listAnswers())[0]).sort()).toEqual([
      'answer',
      'publishedAt',
      'question',
      'slug',
    ])
  })

  it('shows nothing at all while nothing has been published', async () => {
    await asked('A question nobody has answered in the open yet, at some length.')
    expect(await listAnswers()).toHaveLength(0)
  })
})

describe('what the desk is allowed to publish', () => {
  it('turns away a question too short to be one, or an answer too thin', () => {
    expect(validateAnswer({ question: 'Why?', answer: ANSWER }).input).toBeUndefined()
    expect(validateAnswer({ question: 'What is holiness?', answer: 'Yes.' }).input).toBeUndefined()
  })

  it('turns away more than a page should hold', () => {
    expect(validateAnswer({ question: 'x'.repeat(301), answer: ANSWER }).input).toBeUndefined()
    expect(
      validateAnswer({ question: 'What is holiness?', answer: 'x'.repeat(12_001) }).input
    ).toBeUndefined()
  })

  it('accepts the pair, trimmed', () => {
    const checked = validateAnswer({ question: '  What is holiness?  ', answer: `  ${ANSWER}  ` })
    expect(checked.input).toEqual({ question: 'What is holiness?', answer: ANSWER })
  })
})
