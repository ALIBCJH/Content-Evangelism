import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * How many readers said a teaching helped them.
 *
 * One number per teaching and nothing else. Not who, not when, not how
 * often — the same discipline the counters keep, for the same reason:
 * this site knows what has been read and has never known who read it, and
 * a heart is not worth being the thing that changes that.
 *
 * It is its own store rather than another click label on the insight
 * counters, and that is deliberate. The counters are the ministry's
 * private view of how the site is doing; this is a number printed on the
 * page for every reader to see. A figure a stranger reads should not be
 * a side effect of analytics — it should be able to survive the day
 * somebody decides to clear the analytics.
 *
 * ## What one like actually means
 *
 * That a browser said yes once. There is no account here to tie it to, so
 * the only honest description of the number is "how many times somebody
 * on a device that had not already said yes, said yes". The browser
 * remembers and will not ask again (`lib/liked.ts`); clearing site data
 * resets that, and somebody determined could post to the endpoint
 * directly. The rate limit on the route makes that tedious rather than
 * impossible.
 *
 * That is a real limit and it is the right trade for this site. The
 * alternative is accounts, and accounts would cost the anonymity the rest
 * of this codebase spends so much care protecting.
 */

const KV_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? ''
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const usingKv = Boolean(KV_URL && KV_TOKEN)

const KV_KEY = 'likes'
const STORE = path.join(process.cwd(), 'data', 'likes.json')

/** A slug this site could actually have issued. */
export function isSlug(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 120
}

async function kvCommand(command: (string | number)[]): Promise<unknown> {
  const response = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Upstash ${command[0]} returned ${response.status}.`)
  const payload = (await response.json()) as { result?: unknown; error?: string }
  if (payload.error) throw new Error(payload.error)
  return payload.result ?? null
}

/** Every teaching's count, by slug. Empty where nothing has been said. */
export async function readLikes(): Promise<Record<string, number>> {
  try {
    if (usingKv) {
      /* HGETALL comes back as a flat array of field, value, field, value. */
      const flat = (await kvCommand(['HGETALL', KV_KEY])) as unknown[] | null
      const out: Record<string, number> = {}
      if (Array.isArray(flat)) {
        for (let i = 0; i < flat.length - 1; i += 2) {
          const slug = String(flat[i])
          const count = Number(flat[i + 1])
          if (isSlug(slug) && Number.isFinite(count) && count > 0) out[slug] = count
        }
      }
      return out
    }
    const held = JSON.parse(await fs.readFile(STORE, 'utf8')) as unknown
    if (!held || typeof held !== 'object') return {}
    return Object.fromEntries(
      Object.entries(held as Record<string, unknown>)
        .filter(([slug, count]) => isSlug(slug) && typeof count === 'number' && count > 0)
        .map(([slug, count]) => [slug, count as number])
    )
  } catch {
    /* No store, unreadable, or Upstash unreachable. A page with no
       hearts on it is a page; a page that fails to render is not. */
    return {}
  }
}

/** One more. Returns the new count, or null where nothing could be written. */
export async function addLike(slug: string): Promise<number | null> {
  if (!isSlug(slug)) return null
  try {
    if (usingKv) {
      const next = await kvCommand(['HINCRBY', KV_KEY, slug, 1])
      return Number(next)
    }
    const held = await readLikes()
    const next = (held[slug] ?? 0) + 1
    await fs.mkdir(path.dirname(STORE), { recursive: true })
    await fs.writeFile(STORE, `${JSON.stringify({ ...held, [slug]: next }, null, 2)}\n`, 'utf8')
    return next
  } catch {
    return null
  }
}
