import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * The day shelf.
 *
 * The counters were cumulative and never reset, which had two costs the
 * desk felt: "how are we doing this month" had no answer at all, and a
 * teaching published a year ago outranked a better one from last week for
 * ever, because it had a year's head start on a total that only grows.
 *
 * So everything is counted twice — once into a total that is never
 * dropped, and once into the day it happened on. These are the tests that
 * the second shelf agrees with the first, that a day expires without
 * taking the totals with it, and that a store written before any of this
 * existed still reads.
 */

let workspace: string

async function store() {
  vi.resetModules()
  /* The file driver, deliberately: the Redis path is the same field names
     through a different door, and a test that needs a network is a test
     that does not run. */
  vi.stubEnv('KV_REST_API_URL', '')
  vi.stubEnv('KV_REST_API_TOKEN', '')
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
  vi.spyOn(process, 'cwd').mockReturnValue(workspace)
  return import('@/lib/insight')
}

const documentAt = () => path.join(workspace, 'data', 'insight.json')

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'insight-days-'))
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  await fs.rm(workspace, { recursive: true, force: true })
})

const AUGUST_24 = Date.parse('2026-08-24T09:00:00.000Z')
const AUGUST_20 = Date.parse('2026-08-20T09:00:00.000Z')

describe('counting into a day as well as a total', () => {
  it('puts the same numbers on both shelves', async () => {
    const insight = await store()
    await insight.record([{ path: '/articles/one', views: 3, seconds: 600, finished: 2 }], AUGUST_24)

    const ever = await insight.readInsight()
    expect(ever[0]).toMatchObject({ path: '/articles/one', views: 3, seconds: 600, finished: 2 })

    const window = await insight.readInsightRange(7, AUGUST_24)
    expect(window.pages[0]).toMatchObject({ path: '/articles/one', views: 3, finished: 2 })
  })

  it('keeps a day out of a window that does not reach it', async () => {
    const insight = await store()
    await insight.record([{ path: '/articles/one', views: 5 }], AUGUST_20)

    const near = await insight.readInsightRange(2, AUGUST_24)
    expect(near.pages).toEqual([])

    const far = await insight.readInsightRange(7, AUGUST_24)
    expect(far.pages[0].views).toBe(5)

    /* And the totals do not care about windows at all. */
    expect((await insight.readInsight())[0].views).toBe(5)
  })

  it('adds a page’s days together across the window', async () => {
    const insight = await store()
    await insight.record([{ path: '/articles/one', views: 2, seconds: 100 }], AUGUST_20)
    await insight.record([{ path: '/articles/one', views: 3, seconds: 200 }], AUGUST_24)

    const window = await insight.readInsightRange(30, AUGUST_24)
    expect(window.pages[0]).toMatchObject({ views: 5, seconds: 300 })
  })

  it('carries sections and clicks onto the day shelf too', async () => {
    const insight = await store()
    await insight.record(
      [
        {
          path: '/articles/one',
          views: 1,
          clicks: ['listen-article'],
          sections: { opening: 40, cost: 90 },
        },
      ],
      AUGUST_24
    )

    const window = await insight.readInsightRange(7, AUGUST_24)
    expect(window.pages[0].clicks['listen-article']).toBe(1)
    expect(window.pages[0].sections).toEqual({ opening: 40, cost: 90 })
  })
})

describe('the shape of a stretch', () => {
  /* A chart with the quiet days missing is a chart that lies about the
     shape: four visits on one day of seven is not a flat line at four. */
  it('includes the days on which nothing happened', async () => {
    const insight = await store()
    await insight.record([{ path: '/articles/one', views: 4 }], AUGUST_24)

    const { series } = await insight.readInsightRange(7, AUGUST_24)
    expect(series).toHaveLength(7)
    expect(series.filter((day) => day.views === 0)).toHaveLength(6)
    expect(series.at(-1)).toMatchObject({ views: 4 })
  })

  it('runs oldest to newest, so it can be drawn left to right', async () => {
    const insight = await store()
    const { series } = await insight.readInsightRange(5, AUGUST_24)
    expect(series.map((day) => day.day)).toEqual([...series.map((day) => day.day)].sort())
  })

  it('sums the whole site into each day, not one page', async () => {
    const insight = await store()
    await insight.record(
      [
        { path: '/articles/one', views: 2, seconds: 60, finished: 1 },
        { path: '/altars', views: 3, seconds: 30 },
      ],
      AUGUST_24
    )

    const { series } = await insight.readInsightRange(1, AUGUST_24)
    expect(series[0]).toMatchObject({ views: 5, seconds: 90, finished: 1 })
  })

  it('will not be asked for more days than are kept', async () => {
    const insight = await store()
    const { series } = await insight.readInsightRange(9_000, AUGUST_24)
    expect(series).toHaveLength(insight.DAYS_KEPT)
  })

  it('asks for at least one day, whatever it is given', async () => {
    const insight = await store()
    expect((await insight.readInsightRange(0, AUGUST_24)).series).toHaveLength(1)
    expect((await insight.readInsightRange(-5, AUGUST_24)).series).toHaveLength(1)
  })
})

describe('a store written before there were days', () => {
  /* Not a migration. The old document was a flat map of counters, which
     is exactly what the totals are — so it reads as a store with the
     totals intact and no days in it yet. */
  it('still reads, and keeps its totals', async () => {
    await fs.mkdir(path.dirname(documentAt()), { recursive: true })
    await fs.writeFile(
      documentAt(),
      JSON.stringify({ '/articles/old::views': 120, '/articles/old::seconds': 9000 }),
      'utf8'
    )

    const insight = await store()
    const ever = await insight.readInsight()
    expect(ever[0]).toMatchObject({ path: '/articles/old', views: 120, seconds: 9000 })
    expect((await insight.readInsightRange(30, AUGUST_24)).pages).toEqual([])
  })

  it('adds new counting alongside what was already there', async () => {
    await fs.mkdir(path.dirname(documentAt()), { recursive: true })
    await fs.writeFile(documentAt(), JSON.stringify({ '/articles/old::views': 120 }), 'utf8')

    const insight = await store()
    await insight.record([{ path: '/articles/old', views: 5 }], AUGUST_24)

    expect((await insight.readInsight())[0].views).toBe(125)
    expect((await insight.readInsightRange(7, AUGUST_24)).pages[0].views).toBe(5)
  })

  it('treats an unreadable document as an empty one rather than throwing', async () => {
    await fs.mkdir(path.dirname(documentAt()), { recursive: true })
    await fs.writeFile(documentAt(), 'not json at all', 'utf8')

    const insight = await store()
    expect(await insight.readInsight()).toEqual([])
    expect(await insight.record([{ path: '/altars', views: 1 }], AUGUST_24)).toBe(true)
  })
})

describe('the day shelf prunes itself', () => {
  it('drops days past the ones it keeps, and leaves the totals alone', async () => {
    const insight = await store()

    const ancient = Date.now() - (insight.DAYS_KEPT + 40) * 86_400_000
    await insight.record([{ path: '/articles/one', views: 7 }], ancient)
    await insight.record([{ path: '/articles/one', views: 1 }], Date.now())

    const held = JSON.parse(await fs.readFile(documentAt(), 'utf8')) as {
      all: Record<string, number>
      days: Record<string, unknown>
    }
    expect(Object.keys(held.days)).toHaveLength(1)
    /* Nothing is lost — the day went, the total did not. */
    expect(held.all['/articles/one::views']).toBe(8)
  })
})
