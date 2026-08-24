import { promises as fs } from 'node:fs'
import path from 'node:path'
import { authorizedForDesk } from '@/lib/posted'

/**
 * The questions readers send in.
 *
 * People have always had questions about the ministry — about the dress
 * teaching, about a prophecy, about why any of it is taught at all — and
 * until now the site gave them nowhere to put one. Pastoral care is a
 * phone number for someone in trouble, which is the wrong door for
 * somebody who simply wants to ask.
 *
 * What is kept is what a person chose to type, and nothing else. No IP
 * address, no user agent, no identifier: a question is the question, where
 * the reader was reading when it occurred to them, and whatever name or
 * address they decided to give. An email is here so the desk can write
 * back, and for no other purpose — it is never published and never leaves
 * the store.
 *
 * The two drivers behind one shape are the same pair the article store
 * uses, chosen by what is in the environment: Upstash Redis where the
 * deployment has KV credentials, a JSON file at data/questions.json
 * otherwise, so `npm run dev` needs nothing but the repo.
 */

const KV_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? ''
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const KV_KEY = 'questions'
const STORE = path.join(process.cwd(), 'data', 'questions.json')
const usingKv = Boolean(KV_URL && KV_TOKEN)

/**
 * A question the desk has answered in the open.
 *
 * This is a separate thing from the question in the queue, and
 * deliberately so. What a reader typed is theirs — it may name them, it
 * may name somebody else, it may be three paragraphs of context around
 * one sentence of question. What is published is the desk's wording of
 * what was asked and the desk's answer to it, written on purpose.
 *
 * Nothing on this shape can identify anybody: there is no name here, no
 * address, no path, and no id back to the queue. The public read below
 * builds these fresh rather than filtering a question, so a field added
 * to the queue later cannot leak by having been forgotten about.
 */
export interface PublishedAnswer {
  /** Its own address: /questions/<slug>. Minted once and then kept. */
  slug: string
  /** The question as it is published — the desk's wording, not the reader's. */
  question: string
  /** The answer, in the same body grammar a teaching is written in. */
  answer: string
  publishedAt: string
}

/** Where a question stands with the desk. */
export type QuestionStatus = 'new' | 'answered' | 'set-aside'

export const QUESTION_STATUSES: QuestionStatus[] = ['new', 'answered', 'set-aside']

export interface Question {
  id: string
  /** What the reader asked, verbatim. */
  body: string
  /** What they chose to be called; absent when they gave no name. */
  name?: string
  /** For a private reply. Never published, never shown outside the desk. */
  email?: string
  /** The page they were reading — site-relative path and its title. */
  fromPath: string
  fromTitle?: string
  askedAt: string
  status: QuestionStatus
  /** The desk's working note: a draft answer, or why it was set aside. */
  note?: string
  /** Set whenever the desk touches the question. */
  handledAt?: string
  /** Present once the desk has answered this one in the open. */
  published?: PublishedAnswer
}

export interface QuestionInput {
  body: string
  name?: string
  email?: string
  fromPath: string
  fromTitle?: string
}

/** What the desk sends when it publishes, or `null` to take it down. */
export interface PublishInput {
  question: string
  answer: string
}

export interface QuestionResult {
  status: number
  question?: Question
  error?: string
}

/* ── The store ────────────────────────────────────────────────────── */

async function kvCommand(command: (string | number)[]): Promise<unknown> {
  const response = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Upstash ${command[0]} returned ${response.status}.`)
  const payload = (await response.json()) as { result?: unknown; error?: string }
  if (payload.error) throw new Error(`Upstash ${command[0]}: ${payload.error}`)
  return payload.result
}

function parseQuestions(raw: unknown): Question[] {
  if (typeof raw === 'string') {
    try {
      return parseQuestions(JSON.parse(raw))
    } catch {
      return []
    }
  }
  return Array.isArray(raw) ? (raw as Question[]) : []
}

async function readStore(): Promise<Question[]> {
  try {
    if (usingKv) return parseQuestions(await kvCommand(['GET', KV_KEY]))
    return parseQuestions(await fs.readFile(STORE, 'utf8'))
  } catch {
    /* No store yet, malformed, or Upstash unreachable. */
    return []
  }
}

/**
 * One write at a time, and all of it or none of it.
 *
 * The same reasoning as the article store: the queue is a list held in a
 * single document, so two writes interleaved lose a reader's question,
 * and a file write interrupted halfway loses the queue. Writes chain, and
 * the file lands by rename. Per process, as there — a deployment on Redis
 * with several instances still has the window between read and write.
 */
let writing: Promise<boolean> = Promise.resolve(true)

async function writeStore(questions: Question[]): Promise<boolean> {
  const run = writing.then(async () => {
    const serialized = `${JSON.stringify(questions, null, 2)}\n`
    try {
      if (usingKv) {
        await kvCommand(['SET', KV_KEY, serialized])
        return true
      }
      await fs.mkdir(path.dirname(STORE), { recursive: true })
      const temporary = `${STORE}.${process.pid}.tmp`
      await fs.writeFile(temporary, serialized, 'utf8')
      await fs.rename(temporary, STORE)
      return true
    } catch {
      return false
    }
  })
  writing = run.catch(() => false)
  return run
}

/* ── What a question has to be ────────────────────────────────────── */

const LIMITS = { body: 1500, name: 80, email: 160, path: 300, title: 240 }

/**
 * Field checks, worded for the reader rather than for the desk — these
 * messages are read by somebody who has just typed out something they
 * care about, and "validation failed" is not an answer to give them.
 */
export function validateQuestion(
  payload: Record<string, unknown>
): { error?: string; input?: QuestionInput } {
  const body = String(payload.body ?? '').trim()
  const name = String(payload.name ?? '').trim()
  const email = String(payload.email ?? '').trim()
  const fromPath = String(payload.fromPath ?? '/').trim()
  const fromTitle = String(payload.fromTitle ?? '').trim()

  if (body.length < 15) {
    return { error: 'Please write your question out in full so we can answer the right thing.' }
  }
  if (body.length > LIMITS.body) {
    return { error: `Please keep the question under ${LIMITS.body} characters.` }
  }
  if (name.length > LIMITS.name) return { error: 'That name is too long.' }
  if (email.length > LIMITS.email) return { error: 'That email address is too long.' }
  /* Deliberately loose. An address that looks like an address is as much
     as can be told without sending to it, and a stricter pattern only
     turns away real people with unusual addresses. */
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'That email address does not look right. Leave it blank if you would rather.' }
  }
  /* The page a reader was on, as this site's own path — never a URL. */
  if (!fromPath.startsWith('/') || fromPath.length > LIMITS.path) {
    return { error: 'Something went wrong sending the question. Please try again.' }
  }

  return {
    input: {
      body,
      name: name || undefined,
      email: email || undefined,
      fromPath,
      fromTitle: fromTitle.slice(0, LIMITS.title) || undefined,
    },
  }
}

/* ── Publishing an answer ─────────────────────────────────────────── */

const ANSWER_LIMITS = { question: 300, answer: 12_000 }

/** The question as a URL says it, cut at a whole word. */
function slugFor(question: string): string {
  const full = question
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (full.length <= 70) return full || 'question'
  /* Only a slug the length cut through loses its last word — trimming
     unconditionally would drop the last word of every question. */
  const cut = full.slice(0, 70)
  return cut.replace(/-[^-]*$/, '') || cut
}

/** The same, made unique against everything already published. */
function freeSlug(question: string, taken: Set<string>): string {
  const base = slugFor(question)
  if (!taken.has(base)) return base
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${base}-${n}`
    if (!taken.has(candidate)) return candidate
  }
  return `${base}-${Date.now()}`
}

/**
 * The desk's wording, checked before it becomes a page.
 *
 * The messages are for whoever is at the desk rather than for a reader,
 * so they say what is wrong and what the limit is.
 */
export function validateAnswer(payload: Record<string, unknown>): {
  error?: string
  input?: PublishInput
} {
  const question = String(payload.question ?? '').trim()
  const answer = String(payload.answer ?? '').trim()

  if (question.length < 10) return { error: 'Write out the question as it should be published.' }
  if (question.length > ANSWER_LIMITS.question) {
    return { error: `The published question must be under ${ANSWER_LIMITS.question} characters.` }
  }
  if (answer.length < 20) return { error: 'The answer is too short to publish.' }
  if (answer.length > ANSWER_LIMITS.answer) {
    return { error: `The answer must be under ${ANSWER_LIMITS.answer} characters.` }
  }
  return { input: { question, answer } }
}

/* ── Reads and writes ─────────────────────────────────────────────── */

/**
 * Writes are open, because it is a reader posting and there is nobody to
 * authenticate. What keeps that safe is upstream — a honeypot and a rate
 * limit on the route — and here: a question can only ever be a bounded
 * amount of text, and nothing in it is executed, interpolated or trusted.
 */
export async function askQuestion(input: QuestionInput): Promise<QuestionResult> {
  const questions = await readStore()
  const question: Question = {
    id: crypto.randomUUID(),
    body: input.body,
    name: input.name,
    email: input.email,
    fromPath: input.fromPath,
    fromTitle: input.fromTitle,
    askedAt: new Date().toISOString(),
    status: 'new',
  }

  if (!(await writeStore([question, ...questions].slice(0, 5000)))) {
    return { status: 500, error: 'The question could not be saved. Please try again shortly.' }
  }
  return { status: 201, question }
}

/**
 * The answers, for anybody — no key, because these are pages.
 *
 * Built field by field rather than by taking the `published` object off
 * the question, so that this function cannot start returning something
 * new because somebody added a field upstream.
 */
export async function listAnswers(): Promise<PublishedAnswer[]> {
  const questions = await readStore()
  return questions
    .filter((question) => question.published?.slug && question.published.answer)
    .map((question) => ({
      slug: question.published!.slug,
      question: question.published!.question,
      answer: question.published!.answer,
      publishedAt: question.published!.publishedAt,
    }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

/** One answer, by its address. */
export async function answerBySlug(slug: string): Promise<PublishedAnswer | undefined> {
  const answers = await listAnswers()
  return answers.find((answer) => answer.slug === slug)
}

/**
 * The posting key, checked the way the article store checks it: unset
 * means reads are closed, because a missing secret must never mean
 * "allow everyone" — and unlike page counters, these are people's words
 * and sometimes their email addresses.
 */
/**
 * Either desk key opens the queue.
 *
 * It checked ADMIN_TOKEN alone, which was wrong in both directions once
 * the two keys were genuinely separate: a reviewer holding only the
 * review key was refused a queue they are senior enough to clear, and the
 * `===` behind it returned as soon as two bytes differed. The store's own
 * check is constant-time and knows about both keys, so defer to it.
 */
function authorized(token: string): boolean {
  return authorizedForDesk(token)
}

export async function listQuestions(token: string): Promise<{ status: number; questions?: Question[] }> {
  if (!authorized(token)) return { status: 401 }
  const questions = await readStore()
  return { status: 200, questions: [...questions].sort((a, b) => b.askedAt.localeCompare(a.askedAt)) }
}

export async function updateQuestion(
  id: string,
  patch: { status?: QuestionStatus; note?: string; published?: PublishInput | null },
  token: string
): Promise<QuestionResult> {
  if (!authorized(token)) return { status: 401, error: 'Invalid posting key.' }

  const questions = await readStore()
  const index = questions.findIndex((q) => q.id === id)
  if (index === -1) return { status: 404, error: 'No question with that id.' }

  const standing = questions[index]

  /* Publishing. The slug is minted the first time and kept for good after
     that: the desk rewording a question must not break a link somebody
     has already shared, or an address a search engine has indexed. A
     question published in the open is answered by definition, so the
     status follows rather than being set separately and forgotten. */
  let published = standing.published
  if (patch.published === null) {
    published = undefined
  } else if (patch.published) {
    const taken = new Set(
      questions
        .filter((q) => q.id !== id && q.published?.slug)
        .map((q) => q.published!.slug)
    )
    published = {
      slug: standing.published?.slug ?? freeSlug(patch.published.question, taken),
      question: patch.published.question,
      answer: patch.published.answer,
      publishedAt: standing.published?.publishedAt ?? new Date().toISOString(),
    }
  }

  const question: Question = {
    ...standing,
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.note !== undefined ? { note: patch.note.trim() || undefined } : {}),
    ...(published ? { status: 'answered' as QuestionStatus, published } : {}),
    handledAt: new Date().toISOString(),
  }
  if (!published) delete question.published
  questions[index] = question

  if (!(await writeStore(questions))) {
    return { status: 500, error: 'The question store is not writable.' }
  }
  return { status: 200, question }
}

/** 204 deleted, 404 unknown, 401 bad key. */
export async function deleteQuestion(id: string, token: string): Promise<number> {
  if (!authorized(token)) return 401
  const questions = await readStore()
  const remaining = questions.filter((q) => q.id !== id)
  if (remaining.length === questions.length) return 404
  return (await writeStore(remaining)) ? 204 : 500
}
