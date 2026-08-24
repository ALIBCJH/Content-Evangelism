import { promises as fs } from 'node:fs'
import path from 'node:path'
import {
  DAYS_KEPT,
  dayKey,
  recentDays,
  type ClickLabel,
  type DayTotals,
  type EventBatch,
  type PageInsight,
} from '@/lib/insight-shape'

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
 * landing together cannot lose each other's numbers. Redis does that
 * itself; the file driver gets the same guarantee from a write queue and
 * an atomic rename — see `writeFile`.
 *
 * Everything is counted twice: once into a total that is never reset, and
 * once into the day it happened on. The totals alone were a shelf that
 * only ever grew, which meant a teaching published a year ago outranked a
 * better one from last week for ever, and "how are we doing this month"
 * had no answer at all. The day shelf expires after `DAYS_KEPT`, so it
 * prunes itself; the totals do not, so nothing is ever lost.
 */

const KV_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? ''
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const KV_KEY = 'insight'
/** One hash per day, under its own key, so a day can expire on its own. */
const dayHash = (day: string) => `insight:d:${day}`
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

/**
 * Several commands in one round trip.
 *
 * Recording used to be one HTTPS request per field, fired in parallel — a
 * reader finishing a teaching with six sections cost eight calls, and now
 * that every field is counted twice it would cost sixteen. Upstash takes
 * an array of commands at /pipeline and answers them in order, so it is
 * one call whatever the batch holds.
 */
async function kvPipeline(commands: (string | number)[][]): Promise<unknown[]> {
  if (commands.length === 0) return []
  const response = await fetch(`${KV_URL.replace(/\/+$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Upstash pipeline returned ${response.status}.`)
  const payload = (await response.json()) as ({ result?: unknown; error?: string })[]
  if (!Array.isArray(payload)) throw new Error('Upstash pipeline returned an unexpected shape.')
  return payload.map((step) => {
    if (step?.error) throw new Error(`Upstash pipeline: ${step.error}`)
    return step?.result
  })
}

const field = (p: string, name: string) => `${p}::${name}`

/** Field names as they are stored, so the file driver matches Redis. */
function increments(batch: EventBatch): [string, number][] {
  const out: [string, number][] = []
  if (batch.views) out.push([field(batch.path, 'views'), batch.views])
  if (batch.seconds) out.push([field(batch.path, 'seconds'), batch.seconds])
  if (batch.finished) out.push([field(batch.path, 'finished'), batch.finished])
  for (const label of batch.clicks ?? []) out.push([field(batch.path, `click:${label}`), 1])
  for (const [id, seconds] of Object.entries(batch.sections ?? {})) {
    if (seconds > 0) out.push([field(batch.path, `section:${id}`), seconds])
  }
  return out
}

export async function record(batches: EventBatch[], now = Date.now()): Promise<boolean> {
  const pairs = batches.flatMap(increments)
  if (pairs.length === 0) return true

  /* Collapse repeats so one request is one increment per field. */
  const totals = new Map<string, number>()
  for (const [name, n] of pairs) totals.set(name, (totals.get(name) ?? 0) + n)

  const day = dayKey(now)

  try {
    if (usingKv) {
      const commands: (string | number)[][] = []
      Array.from(totals).forEach(([name, n]) => {
        commands.push(['HINCRBY', KV_KEY, name, n])
        commands.push(['HINCRBY', dayHash(day), name, n])
      })
      /* Refreshed on every write rather than set once. A key created on a
         quiet day and never touched again would otherwise expire from the
         moment it was made, and the expiry is meant to be measured from
         the last thing that happened, not the first. */
      commands.push(['EXPIRE', dayHash(day), DAYS_KEPT * 86_400])
      await kvPipeline(commands)
      return true
    }
    await writeFile(totals, day)
    return true
  } catch {
    /* A reader's page must never fail because a counter did. */
    return false
  }
}

/**
 * The file driver's writes, one at a time and all-or-nothing.
 *
 * Redis increments in place, so two requests landing together cannot lose
 * each other's numbers. The file driver reads the whole document, adds to
 * it and writes it back — and two of those interleaved lose an update at
 * best, and leave a half-written document on disk at worst, which is
 * exactly what happened once a second reporter started sending alongside
 * the first.
 *
 * So: a promise chain, which is enough because a Node process is one
 * writer, and a write through a temporary file and a rename, which is
 * atomic on any POSIX filesystem — a reader either sees the document
 * before or the document after, never half of each.
 */
let writing: Promise<void> = Promise.resolve()

/** The file driver's document: the totals, and the days beside them. */
interface FileStore {
  all: Record<string, number>
  days: Record<string, Record<string, number>>
}

function writeFile(totals: Map<string, number>, day: string): Promise<void> {
  writing = writing.then(async () => {
    const current = await readFileStore()
    const today = (current.days[day] ??= {})
    Array.from(totals).forEach(([name, n]) => {
      current.all[name] = (current.all[name] ?? 0) + n
      today[name] = (today[name] ?? 0) + n
    })

    /* The day shelf prunes itself on Redis by expiring. Nothing expires a
       file, so it is pruned here — otherwise `npm run dev` would grow a
       document for ever with no ceiling anybody would notice. */
    const keep = new Set(recentDays(DAYS_KEPT, Date.now()))
    for (const held of Object.keys(current.days)) {
      if (!keep.has(held)) delete current.days[held]
    }

    await fs.mkdir(path.dirname(STORE), { recursive: true })
    const temporary = `${STORE}.${process.pid}.tmp`
    await fs.writeFile(temporary, `${JSON.stringify(current, null, 2)}\n`, 'utf8')
    await fs.rename(temporary, STORE)
  })
  return writing
}

/** Upstash answers HGETALL as a flat array or an object, depending. */
function asCounters(flat: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (Array.isArray(flat)) {
    for (let i = 0; i < flat.length; i += 2) out[String(flat[i])] = Number(flat[i + 1]) || 0
  } else if (flat && typeof flat === 'object') {
    for (const [k, v] of Object.entries(flat as Record<string, unknown>)) out[k] = Number(v) || 0
  }
  return out
}

/**
 * The file document, in either shape it may be on disk.
 *
 * Before there were days it was a flat map of counters. A deployment
 * upgrading in place has one of those, and reading it as though the whole
 * document were the totals is exactly right — so the old shape is not a
 * migration, it is just a document with no days in it yet.
 */
async function readFileStore(): Promise<FileStore> {
  try {
    const parsed = JSON.parse(await fs.readFile(STORE, 'utf8')) as unknown
    if (!parsed || typeof parsed !== 'object') return { all: {}, days: {} }
    const shaped = parsed as Partial<FileStore> & Record<string, unknown>
    if (shaped.all && typeof shaped.all === 'object') {
      return { all: shaped.all as Record<string, number>, days: (shaped.days ?? {}) as FileStore['days'] }
    }
    return { all: parsed as Record<string, number>, days: {} }
  } catch {
    return { all: {}, days: {} }
  }
}

async function readRaw(): Promise<Record<string, number>> {
  try {
    if (usingKv) return asCounters(await kvCommand(['HGETALL', KV_KEY]))
    return (await readFileStore()).all
  } catch {
    return {}
  }
}

/** The counters for a run of days, in the order they were asked for. */
async function readDays(days: string[]): Promise<Record<string, number>[]> {
  try {
    if (usingKv) {
      const answers = await kvPipeline(days.map((day) => ['HGETALL', dayHash(day)]))
      return answers.map(asCounters)
    }
    const store = await readFileStore()
    return days.map((day) => store.days[day] ?? {})
  } catch {
    return days.map(() => ({}))
  }
}

/**
 * Counters as they are stored, arranged by the page they belong to.
 *
 * Shared by the all-time read and the by-day one, which hold identical
 * field names in different hashes — the only difference between "ever"
 * and "this week" here is which shelf the numbers came off.
 */
function toPages(raw: Record<string, number>): PageInsight[] {
  const pages = new Map<string, PageInsight>()

  for (const [name, value] of Object.entries(raw)) {
    const at = name.lastIndexOf('::')
    if (at < 1) continue
    const p = name.slice(0, at)
    const key = name.slice(at + 2)
    const page =
      pages.get(p) ?? { path: p, views: 0, seconds: 0, finished: 0, clicks: {}, sections: {} }
    if (key === 'views') page.views = value
    else if (key === 'seconds') page.seconds = value
    else if (key === 'finished') page.finished = value
    else if (key.startsWith('click:')) {
      page.clicks[key.slice(6) as ClickLabel] = value
    } else if (key.startsWith('section:')) {
      page.sections[key.slice(8)] = value
    }
    pages.set(p, page)
  }

  return Array.from(pages.values()).sort((a, b) => b.views - a.views)
}

/** Every page that has been read, ever, busiest first. */
export async function readInsight(): Promise<PageInsight[]> {
  return toPages(await readRaw())
}

/**
 * The same thing for a run of recent days, and the shape of those days.
 *
 * Two answers from one read, because the desk asks two questions of the
 * same numbers: which pieces held readers over this stretch, and whether
 * the stretch was better or worse than the one before it. `series` is
 * every day in the window including the empty ones — a chart with the
 * quiet days missing is a chart that lies about the shape.
 */
export async function readInsightRange(
  days: number,
  now = Date.now()
): Promise<{ pages: PageInsight[]; series: DayTotals[]; days: string[] }> {
  const wanted = recentDays(Math.max(1, Math.min(days, DAYS_KEPT)), now)
  const counters = await readDays(wanted)

  const summed: Record<string, number> = {}
  const series: DayTotals[] = wanted.map((day, index) => {
    const held = counters[index] ?? {}
    const totals: DayTotals = { day, views: 0, seconds: 0, finished: 0 }
    for (const [name, value] of Object.entries(held)) {
      summed[name] = (summed[name] ?? 0) + value
      if (name.endsWith('::views')) totals.views += value
      else if (name.endsWith('::seconds')) totals.seconds += value
      else if (name.endsWith('::finished')) totals.finished += value
    }
    return totals
  })

  return { pages: toPages(summed), series, days: wanted }
}

/* The per-page arithmetic lives in insight-shape, so the desk's own
   client page can do it without node:fs coming with it. Kept under the
   names callers already use. */
export { averageSecondsOf as averageSeconds, finishRateOf as finishRate } from '@/lib/insight-shape'
