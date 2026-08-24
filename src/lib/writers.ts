import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import type { ArtPalette } from '@/lib/content'

/* promisify picks the three-argument overload, which leaves no way to
   pass the cost parameter. Wrapped by hand so the options are typed. */
const scrypt = (secret: string, salt: string, length: number, options: { N: number }) =>
  new Promise<Buffer>((resolve, reject) => {
    scryptCallback(secret, salt, length, options, (error, key) =>
      error ? reject(error) : resolve(key)
    )
  })

/**
 * The people who write here.
 *
 * Until now the site had no concept of a person. Everyone at the desk
 * shared one key, and the byline was a free-text box — so "Simon Juma",
 * "simon juma" and "SIMON JUMA" were three authors, none of whom had a
 * page, and nothing anywhere could say who had written or approved
 * anything. A ministry publishing under its own name should be able to
 * answer both.
 *
 * A writer is one record: who they are, what the site should say about
 * them, and one key that is theirs.
 *
 * The key carries the writer's id in front of the secret — `id.secret` —
 * which is not a leak (an id is a public thing; it is in the address of
 * their author page) and buys two properties worth having. Signing in is
 * one lookup rather than a comparison against every writer in turn, and
 * because it is one lookup the secret can be checked with a deliberately
 * slow hash instead of a fast one. The ministry's own two env keys have
 * no dot and fall through to the check they always had, so a deployment
 * that never adds a writer is unaffected.
 *
 * Nothing here stores a key. What is stored is a salt and a scrypt hash,
 * so the store — and anybody who ever sees a backup of it — holds nothing
 * that opens the desk.
 */

const KV_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? ''
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const KV_KEY = 'writers'
const STORE = path.join(process.cwd(), 'data', 'writers.json')
const usingKv = Boolean(KV_URL && KV_TOKEN)

/** What the site says about a writer, and what they may change. */
export interface WriterProfile {
  /** "Devotional Editor", "Oracles & Prophecy Desk". */
  role: string
  bio: string
}

export interface Writer {
  /** Also the address of their author page: /authors/<id>. */
  id: string
  name: string
  role: string
  bio: string
  /** Which of the archive's palettes their page is drawn in. */
  accent: ArtPalette
  /** scrypt, with the salt beside it. Never the key. */
  salt: string
  hash: string
  /** Whether this writer may also approve. */
  canReview: boolean
  /**
   * A writer edits their own profile and it goes on the site the way a
   * teaching does — after the review desk approves it. Absent means
   * nothing is waiting.
   */
  pendingProfile?: WriterProfile & { at: string }
  /**
   * Turned off rather than deleted. Their name is on published teachings
   * and their author page is an address somebody may have shared; what
   * ends is the key, not the record.
   */
  active: boolean
  addedAt: string
}

/** A writer as anything outside this module may see them — no secrets. */
export type PublicWriter = Omit<Writer, 'salt' | 'hash'>

export function withoutSecrets(writer: Writer): PublicWriter {
  const { salt: _salt, hash: _hash, ...rest } = writer
  return rest
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

function parse(raw: unknown): Writer[] {
  if (typeof raw === 'string') {
    try {
      return parse(JSON.parse(raw))
    } catch {
      return []
    }
  }
  return Array.isArray(raw) ? (raw as Writer[]) : []
}

export async function listWriters(): Promise<Writer[]> {
  try {
    if (usingKv) return parse(await kvCommand(['GET', KV_KEY]))
    return parse(await fs.readFile(STORE, 'utf8'))
  } catch {
    /* No registry yet is the ordinary state of a deployment that has not
       added anybody. The env keys still open the desk. */
    return []
  }
}

/**
 * One writer at a time, all of it or none.
 *
 * The same reasoning as the article store: the registry is one document,
 * a write reads it and puts it back, and two of those interleaved lose
 * one of them — which here would mean a writer added and silently gone.
 */
let writing: Promise<boolean> = Promise.resolve(true)

async function save(writers: Writer[]): Promise<boolean> {
  const run = writing.then(async () => {
    const serialized = `${JSON.stringify(writers, null, 2)}\n`
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

/* ── Keys ─────────────────────────────────────────────────────────── */

const SCRYPT_BYTES = 32
/* scrypt's defaults, which are the ones to use unless there is a reason.
   Around 100ms, which is nothing on a sign-in and a great deal to
   anybody working through a stolen registry. */
const SCRYPT_COST = 16_384

async function derive(secret: string, salt: string): Promise<string> {
  const key = await scrypt(secret, salt, SCRYPT_BYTES, { N: SCRYPT_COST })
  return key.toString('base64url')
}

/** An id from a name: "Rev. Elizabeth Omondi" → "elizabeth-omondi". */
export function idFor(name: string, taken: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      /* Titles are how somebody is addressed, not who they are, and an
         author page at /authors/rev-dr-elizabeth-omondi is an address that
         changes the day they are made a bishop. */
      .replace(/\b(rev|dr|prof|pastor|bishop|apostle|prophet|evangelist|mr|mrs|ms)\.?\s+/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'writer'
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

/** The half of a key that is secret. */
function mintSecret(): string {
  return randomBytes(24).toString('base64url')
}

/** The key as it is handed over, once. */
export const keyFor = (id: string, secret: string): string => `${id}.${secret}`

/** The two halves of a presented key, or null if it is not one. */
export function splitKey(given: string): { id: string; secret: string } | null {
  const at = given.indexOf('.')
  if (at < 1 || at === given.length - 1) return null
  const id = given.slice(0, at)
  /* Only what an id can be. Anything else is not a writer's key, and
     asking the store about it would be asking about a made-up name. */
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) return null
  return { id, secret: given.slice(at + 1) }
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) {
    timingSafeEqual(left, left)
    return false
  }
  return timingSafeEqual(left, right)
}

/**
 * The writer a key belongs to, or null.
 *
 * Null for a key that is not a writer's shape at all, for an id nobody
 * has, for a secret that does not match, and for a writer who has been
 * turned off — four different facts, one answer, because telling them
 * apart tells somebody holding a guess which half of it was right.
 */
export async function writerForKey(given: string): Promise<Writer | null> {
  const split = splitKey(given)
  if (!split) return null

  const writer = (await listWriters()).find((held) => held.id === split.id)
  if (!writer) return null

  const offered = await derive(split.secret, writer.salt)
  if (!sameHash(offered, writer.hash)) return null
  return writer.active ? writer : null
}

/* ── Adding, changing, ending ─────────────────────────────────────── */

export const NAME_MAX = 120
export const ROLE_MAX = 120
export const BIO_MAX = 600

export interface AddWriterInput {
  name: string
  role: string
  bio: string
  canReview?: boolean
  accent?: ArtPalette
}

export function validateWriter(payload: Record<string, unknown>): {
  error?: string
  input?: AddWriterInput
} {
  const name = String(payload.name ?? '').trim()
  const role = String(payload.role ?? '').trim()
  const bio = String(payload.bio ?? '').trim()

  if (name.length < 2) return { error: 'A name is required.' }
  if (name.length > NAME_MAX) return { error: `A name may not exceed ${NAME_MAX} characters.` }
  if (role.length < 2) return { error: 'Say what they do here.' }
  if (role.length > ROLE_MAX) return { error: `A role may not exceed ${ROLE_MAX} characters.` }
  /* The bio is the whole of an author page and most of what Google reads
     to decide the byline is a real person. One line is not enough to be
     worth publishing. */
  if (bio.length < 20) return { error: 'Write at least a sentence about them.' }
  if (bio.length > BIO_MAX) return { error: `A biography may not exceed ${BIO_MAX} characters.` }

  return {
    input: {
      name,
      role,
      bio,
      canReview: payload.canReview === true,
      accent: (payload.accent as ArtPalette) ?? 'dawn',
    },
  }
}

/**
 * Add a writer, and hand back their key — the only time it exists in
 * readable form. It is not stored, cannot be recovered, and is shown once
 * for the reviewer to pass on.
 */
export async function addWriter(
  input: AddWriterInput
): Promise<{ writer: PublicWriter; key: string } | null> {
  const writers = await listWriters()
  const id = idFor(input.name, new Set(writers.map((held) => held.id)))
  const secret = mintSecret()
  const salt = randomBytes(16).toString('base64url')

  const writer: Writer = {
    id,
    name: input.name,
    role: input.role,
    bio: input.bio,
    accent: input.accent ?? 'dawn',
    salt,
    hash: await derive(secret, salt),
    canReview: input.canReview === true,
    active: true,
    addedAt: new Date().toISOString(),
  }

  if (!(await save([...writers, writer]))) return null
  return { writer: withoutSecrets(writer), key: keyFor(id, secret) }
}

/** A new key for somebody who lost theirs. The old one stops working. */
export async function newKeyFor(id: string): Promise<string | null> {
  const writers = await listWriters()
  const index = writers.findIndex((held) => held.id === id)
  if (index === -1) return null

  const secret = mintSecret()
  const salt = randomBytes(16).toString('base64url')
  writers[index] = { ...writers[index], salt, hash: await derive(secret, salt) }
  return (await save(writers)) ? keyFor(id, secret) : null
}

/** Turn a writer's key off, or back on. The record and their page stay. */
export async function setActive(id: string, active: boolean): Promise<PublicWriter | null> {
  const writers = await listWriters()
  const index = writers.findIndex((held) => held.id === id)
  if (index === -1) return null
  writers[index] = { ...writers[index], active }
  return (await save(writers)) ? withoutSecrets(writers[index]) : null
}

/** A writer proposing new words about themselves. Not yet on the site. */
export async function proposeProfile(
  id: string,
  profile: WriterProfile
): Promise<PublicWriter | null> {
  const writers = await listWriters()
  const index = writers.findIndex((held) => held.id === id)
  if (index === -1) return null

  writers[index] = {
    ...writers[index],
    pendingProfile: { ...profile, at: new Date().toISOString() },
  }
  return (await save(writers)) ? withoutSecrets(writers[index]) : null
}

/**
 * The review desk's verdict on a proposed profile.
 *
 * The same rule as a teaching: a writer may write what the site says
 * about them, and somebody else decides whether it goes on the site.
 */
export async function decideProfile(
  id: string,
  approve: boolean
): Promise<PublicWriter | null> {
  const writers = await listWriters()
  const index = writers.findIndex((held) => held.id === id)
  if (index === -1) return null

  const held = writers[index]
  const { pendingProfile, ...rest } = held
  writers[index] =
    approve && pendingProfile
      ? { ...rest, role: pendingProfile.role, bio: pendingProfile.bio }
      : rest

  return (await save(writers)) ? withoutSecrets(writers[index]) : null
}
