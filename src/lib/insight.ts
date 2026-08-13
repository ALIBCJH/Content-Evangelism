import { promises as fs } from 'node:fs'
import path from 'node:path'
import { type ClickLabel, type EventBatch, type PageInsight } from '@/lib/insight-shape'

export * from '@/lib/insight-shape'

/**
 * What the site knows about how it is read.
 *
 * This is deliberately not analytics in the usual sense. The site already
 * refuses to hand its readers to a third party — the fonts are served from
 * this origin, the embeds go through the no-cookie host — and it would be
 * incoherent to then set a tracker on them. So nothing here identifies
 * anybody:
 *
 *   - No cookie is set, and none is read.
 *   - No IP address, user agent, referrer or location is stored.
 *   - No identifier of any kind is issued, so two visits by one reader are
 *     indistinguishable from one visit by two.
 *   - Nothing is stored per reader at all. What is kept is a small set of
 *     counters per page, and a counter cannot be walked back to a person.
 *
 * What that costs is real and worth stating: there are no unique visitors
 * here, no sessions, no funnels, and no way to ask what any one reader
 * did. What it buys is the answer to the questions the ministry actually
 * has — which teachings are read, how long readers stay with them, and
 * which of them are finished.
 *
 * Counters are incremented rather than read-and-written, so two requests
 * landing together cannot lose each other's numbers.
 */

const KV_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? ''
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const KV_KEY = 'insight'
const STORE = path.join(process.cwd(), 'data', 'insight.json')
const usingKv = Boolean(KV_URL && KV_TOKEN)

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

const field = (p: string, name: string) => `${p}::${name}`

/** Field names as they are stored, so the file driver matches Redis. */
function increments(batch: EventBatch): [string, number][] {
  const out: [string, number][] = []
  if (batch.views) out.push([field(batch.path, 'views'), batch.views])
  if (batch.seconds) out.push([field(batch.path, 'seconds'), batch.seconds])
  if (batch.finished) out.push([field(batch.path, 'finished'), batch.finished])
  for (const label of batch.clicks ?? []) out.push([field(batch.path, `click:${label}`), 1])
  return out
}

export async function record(batches: EventBatch[]): Promise<boolean> {
  const pairs = batches.flatMap(increments)
  if (pairs.length === 0) return true

  /* Collapse repeats so one request is one increment per field. */
  const totals = new Map<string, number>()
  for (const [name, n] of pairs) totals.set(name, (totals.get(name) ?? 0) + n)

  try {
    if (usingKv) {
      await Promise.all(
        Array.from(totals, ([name, n]) => kvCommand(['HINCRBY', KV_KEY, name, n]))
      )
      return true
    }
    const current = await readRaw()
    Array.from(totals).forEach(([name, n]) => {
      current[name] = (current[name] ?? 0) + n
    })
    await fs.mkdir(path.dirname(STORE), { recursive: true })
    await fs.writeFile(STORE, `${JSON.stringify(current, null, 2)}\n`, 'utf8')
    return true
  } catch {
    /* A reader's page must never fail because a counter did. */
    return false
  }
}

async function readRaw(): Promise<Record<string, number>> {
  try {
    if (usingKv) {
      const flat = (await kvCommand(['HGETALL', KV_KEY])) as unknown
      const out: Record<string, number> = {}
      if (Array.isArray(flat)) {
        for (let i = 0; i < flat.length; i += 2) out[String(flat[i])] = Number(flat[i + 1]) || 0
      } else if (flat && typeof flat === 'object') {
        for (const [k, v] of Object.entries(flat as Record<string, unknown>)) out[k] = Number(v) || 0
      }
      return out
    }
    return JSON.parse(await fs.readFile(STORE, 'utf8')) as Record<string, number>
  } catch {
    return {}
  }
}

/** Every page that has been read, busiest first. */
export async function readInsight(): Promise<PageInsight[]> {
  const raw = await readRaw()
  const pages = new Map<string, PageInsight>()

  for (const [name, value] of Object.entries(raw)) {
    const at = name.lastIndexOf('::')
    if (at < 1) continue
    const p = name.slice(0, at)
    const key = name.slice(at + 2)
    const page =
      pages.get(p) ?? { path: p, views: 0, seconds: 0, finished: 0, clicks: {} }
    if (key === 'views') page.views = value
    else if (key === 'seconds') page.seconds = value
    else if (key === 'finished') page.finished = value
    else if (key.startsWith('click:')) {
      page.clicks[key.slice(6) as ClickLabel] = value
    }
    pages.set(p, page)
  }

  return Array.from(pages.values()).sort((a, b) => b.views - a.views)
}

/** Mean engaged time on a page, in seconds. */
export const averageSeconds = (page: PageInsight): number =>
  page.views > 0 ? Math.round(page.seconds / page.views) : 0
