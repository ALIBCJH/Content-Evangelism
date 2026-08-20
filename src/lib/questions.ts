import { promises as fs } from 'node:fs'
import path from 'node:path'

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
}

export interface QuestionInput {
  body: string
  name?: string
  email?: string
  fromPath: string
  fromTitle?: string
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
 * The posting key, checked the way the article store checks it: unset
 * means reads are closed, because a missing secret must never mean
 * "allow everyone" — and unlike page counters, these are people's words
 * and sometimes their email addresses.
 */
function authorized(token: string): boolean {
  const expected = process.env.ADMIN_TOKEN ?? ''
  return expected.length > 0 && token === expected
}

export async function listQuestions(token: string): Promise<{ status: number; questions?: Question[] }> {
  if (!authorized(token)) return { status: 401 }
  const questions = await readStore()
  return { status: 200, questions: [...questions].sort((a, b) => b.askedAt.localeCompare(a.askedAt)) }
}

export async function updateQuestion(
  id: string,
  patch: { status?: QuestionStatus; note?: string },
  token: string
): Promise<QuestionResult> {
  if (!authorized(token)) return { status: 401, error: 'Invalid posting key.' }

  const questions = await readStore()
  const index = questions.findIndex((q) => q.id === id)
  if (index === -1) return { status: 404, error: 'No question with that id.' }

  const question: Question = {
    ...questions[index],
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.note !== undefined ? { note: patch.note.trim() || undefined } : {}),
    handledAt: new Date().toISOString(),
  }
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
