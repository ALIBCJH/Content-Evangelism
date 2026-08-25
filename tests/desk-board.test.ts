import { describe, expect, it } from 'vitest'
import {
  DAYS_KEPT,
  cleanPath,
  dayKey,
  finishRateOf,
  recentDays,
  sitePart,
} from '@/lib/insight-shape'
import {
  DEAD_END_RATE,
  ENOUGH_TO_JUDGE,
  byPart,
  clickTotals,
  deadEnds,
  healthNotes,
  needsAttention,
  pieceRows,
  summarise,
  unread,
  type DeskArticle,
  type DeskHealth,
} from '@/lib/desk-overview'
import { change, duration, headingWords, percent } from '@/components/admin/board/format'
import { EVERY_SECTION, narrow, sectionCounts } from '@/lib/desk-overview'
import type { DayTotals, PageInsight } from '@/lib/insight-shape'

/**
 * The board the review desk opens on.
 *
 * Every number here is shown to somebody deciding what the ministry
 * publishes, so the tests are less about arithmetic than about the
 * arithmetic not overclaiming: a rate off three visits, a percentage
 * change against a week with nothing in it, a finish count higher than
 * the visits that produced it.
 */

const page = (path: string, over: Partial<PageInsight> = {}): PageInsight => ({
  path,
  views: 0,
  seconds: 0,
  finished: 0,
  clicks: {},
  sections: {},
  ...over,
})

const article = (slug: string, over: Partial<DeskArticle> = {}): DeskArticle => ({
  slug,
  title: slug,
  category: 'Teachings',
  authorName: 'The Editorial Desk',
  publishedAt: '2026-08-01T00:00:00.000Z',
  readMinutes: 5,
  status: 'published',
  ...over,
})

describe('the day a thing is counted against', () => {
  /* Nairobi, not UTC. The ministry's evening runs past the UTC midnight
     for two of its busiest hours, and a day with a seam in the middle of
     the evening is not a day anybody at this desk would recognise. */
  it('uses the site’s own clock, not the server’s', () => {
    /* 2026-08-24 22:30 UTC is already the 25th in Nairobi. */
    const lateEvening = Date.parse('2026-08-24T22:30:00.000Z')
    expect(dayKey(lateEvening)).toBe('2026-08-25')
  })

  it('names days in an order that sorts', () => {
    const days = recentDays(5, Date.parse('2026-08-24T09:00:00.000Z'))
    expect(days).toHaveLength(5)
    expect([...days].sort()).toEqual(days)
    expect(days.at(-1)).toBe('2026-08-24')
  })

  it('keeps a bounded stretch', () => {
    expect(recentDays(DAYS_KEPT, Date.now())).toHaveLength(DAYS_KEPT)
  })
})

describe('pages that were shipping uncounted', () => {
  /* The answered questions are published work with their own addresses,
     and the altars page is what a reader opens to find out where to go on
     Sunday. Neither was in the accepted list, so neither was ever seen. */
  it('now counts the questions and the altars', () => {
    expect(cleanPath('/questions')).toBe('/questions')
    expect(cleanPath('/questions/what-is-the-unforgivable-sin')).toBe(
      '/questions/what-is-the-unforgivable-sin'
    )
    expect(cleanPath('/altars')).toBe('/altars')
    expect(cleanPath('/altars/nairobi')).toBe('/altars/nairobi')
  })

  it('still refuses anything that is not a page of this site', () => {
    expect(cleanPath('/wp-admin')).toBeNull()
    expect(cleanPath('https://elsewhere.test/')).toBeNull()
    expect(cleanPath('/articles/../../etc/passwd')).toBeNull()
  })
})

describe('which part of the site a path belongs to', () => {
  it('puts each page in its room', () => {
    expect(sitePart('/')).toBe('Front page')
    expect(sitePart('/articles/why-does-god-allow-suffering')).toBe('Articles')
    expect(sitePart('/questions/what-is-repentance')).toBe('Questions')
    expect(sitePart('/altars/samburu')).toBe('Altars')
    expect(sitePart('/teachings/church-age-coming-to-an-end')).toBe('Teachings')
    expect(sitePart('/about')).toBe('About')
  })
})

describe('what needs the desk', () => {
  const queue = [
    article('a', { status: 'pending' }),
    article('b', { status: 'pending', review: { note: 'Rework the opening.', at: 'now' } }),
    article('c', { status: 'published', verified: true }),
    article('d', { status: 'published' }),
    article('e', { status: 'published' }),
  ]

  it('separates what is waiting from what was sent back', () => {
    const needs = needsAttention(queue, [])
    expect(needs.waiting).toBe(1)
    expect(needs.sentBack).toBe(1)
  })

  /* The debt rather than the measurement: everything published before
     there was a review step carries no verified mark, correctly, and that
     is exactly why it belongs at the top of the page. */
  it('counts what is on the site and was never checked', () => {
    expect(needsAttention(queue, []).unverified).toBe(2)
  })

  it('counts the readers still waiting on an answer', () => {
    const questions = [{ status: 'new' }, { status: 'new' }, { status: 'answered' }]
    expect(needsAttention(queue, questions).unanswered).toBe(2)
  })

  /* A piece with no status is live — everything written before the review
     step existed, and it must not be counted as waiting. */
  it('treats a piece with no status as live', () => {
    const needs = needsAttention([article('old', { status: undefined })], [])
    expect(needs.waiting).toBe(0)
    expect(needs.unverified).toBe(1)
  })
})

describe('joining the writing to what readers did with it', () => {
  const articles = [article('held'), article('glanced'), article('never-opened')]
  const window = [
    page('/articles/held', { views: 100, seconds: 30_000, finished: 80 }),
    page('/articles/glanced', { views: 400, seconds: 4_000, finished: 12 }),
  ]
  const ever = [
    page('/articles/held', { views: 900, seconds: 1, finished: 1, sections: { opening: 30, cost: 120 } }),
    page('/articles/glanced', { views: 2_000 }),
  ]

  it('gives a piece nobody opened a row of zeroes rather than no row', () => {
    const rows = pieceRows(articles, window, ever)
    expect(rows).toHaveLength(3)
    const missing = rows.find((row) => row.slug === 'never-opened')
    expect(missing?.views).toBe(0)
    expect(missing?.finishRate).toBe(0)
  })

  /* Ordered by attention, not by doors: a headline opened four hundred
     times and abandoned should not outrank a teaching that was read. */
  it('ranks by time spent rather than by visits', () => {
    const rows = pieceRows(articles, window, ever)
    expect(rows[0].slug).toBe('held')
    expect(rows[0].views).toBeLessThan(rows[1].views)
  })

  it('carries the all-time count beside the window’s', () => {
    const rows = pieceRows(articles, window, ever)
    const held = rows.find((row) => row.slug === 'held')
    expect(held?.views).toBe(100)
    expect(held?.viewsEver).toBe(900)
  })

  it('gives each section its share of the piece’s time, largest first', () => {
    const rows = pieceRows(articles, window, ever)
    const sections = rows.find((row) => row.slug === 'held')?.sections ?? []
    expect(sections.map((s) => s.id)).toEqual(['cost', 'opening'])
    expect(sections[0].share).toBeCloseTo(0.8)
  })
})

describe('the two lists that are advice', () => {
  const rows = pieceRows(
    [article('abandoned'), article('fine'), article('thin'), article('forgotten')],
    [
      page('/articles/abandoned', { views: 300, finished: 15, seconds: 900 }),
      page('/articles/fine', { views: 300, finished: 240, seconds: 90_000 }),
      /* Below the floor: two visits and no finishes is two people, not a
         finding, and must not be printed as a failing teaching. */
      page('/articles/thin', { views: 2, finished: 0, seconds: 40 }),
    ],
    [
      page('/articles/abandoned', { views: 300 }),
      page('/articles/fine', { views: 300 }),
      page('/articles/thin', { views: 2 }),
    ]
  )

  it('names a piece readers open and leave', () => {
    expect(deadEnds(rows).map((row) => row.slug)).toEqual(['abandoned'])
  })

  it('refuses to judge a piece on too few readings', () => {
    expect(deadEnds(rows).map((row) => row.slug)).not.toContain('thin')
    expect(ENOUGH_TO_JUDGE).toBeGreaterThan(2)
    expect(DEAD_END_RATE).toBeLessThan(0.5)
  })

  it('names what is published and barely opened', () => {
    const quiet = unread(rows).map((row) => row.slug)
    expect(quiet).toContain('forgotten')
    expect(quiet).not.toContain('fine')
  })

  /* A teaching still in the queue has not failed to find readers; it has
     not been offered to any. */
  it('leaves pending pieces out of both', () => {
    const pending = pieceRows([article('waiting', { status: 'pending' })], [], [])
    expect(unread(pending)).toHaveLength(0)
    expect(deadEnds(pending)).toHaveLength(0)
  })
})

describe('where the time goes', () => {
  const pages = [
    page('/', { views: 2_000, seconds: 20_000 }),
    page('/articles/one', { views: 100, seconds: 60_000 }),
    page('/articles/two', { views: 100, seconds: 20_000 }),
    page('/altars', { views: 50, seconds: 5_000 }),
  ]

  it('gathers pages into their part of the site, most time first', () => {
    const parts = byPart(pages)
    expect(parts[0].part).toBe('Articles')
    expect(parts[0].seconds).toBe(80_000)
    expect(parts[0].views).toBe(200)
  })

  it('gives each part its share of all engaged time', () => {
    const parts = byPart(pages)
    const total = parts.reduce((sum, row) => sum + row.share, 0)
    expect(total).toBeCloseTo(1)
  })

  it('leaves out the parts nobody has been to', () => {
    expect(byPart(pages).map((row) => row.part)).not.toContain('Search')
  })

  it('has nothing to say about an empty stretch', () => {
    expect(byPart([])).toEqual([])
  })

  it('totals the clicks across every page', () => {
    const totals = clickTotals([
      page('/', { clicks: { 'read-article': 10, 'hero-primary': 4 } }),
      page('/articles/one', { clicks: { 'read-article': 5, 'listen-article': 9 } }),
    ])
    expect(totals[0]).toEqual({ label: 'read-article', count: 15 })
    expect(totals.map((t) => t.count)).toEqual([15, 9, 4])
  })
})

describe('the stretch, against the one before it', () => {
  const days = (values: number[]): DayTotals[] =>
    values.map((views, index) => ({
      day: `2026-08-${String(index + 1).padStart(2, '0')}`,
      views,
      small: Math.round(views * 0.7),
      large: views - Math.round(views * 0.7),
      seconds: views * 60,
      finished: Math.floor(views / 2),
    }))

  it('reports the change as a proportion', () => {
    const summary = summarise(days([10, 10]), days([8, 8]))
    expect(summary.visits).toBe(20)
    expect(summary.change.visits).toBeCloseTo(0.25)
  })

  /* A site with nothing last month and forty visits this month has not
     grown by a percentage — it has started. Null says so, and the board
     prints a dash rather than an infinity. */
  it('refuses to divide by a stretch with nothing in it', () => {
    const summary = summarise(days([40]), days([0]))
    expect(summary.change.visits).toBeNull()
    expect(change(summary.change.visits).text).toBe('—')
  })

  it('reads a fall as a fall', () => {
    expect(summarise(days([5]), days([10])).change.visits).toBeCloseTo(-0.5)
    expect(change(-0.5).direction).toBe('down')
  })

  it('has nothing to divide when both stretches are empty', () => {
    const summary = summarise([], [])
    expect(summary.visits).toBe(0)
    expect(summary.finishRate).toBe(0)
    expect(summary.change.visits).toBeNull()
  })
})

describe('rates that cannot overclaim', () => {
  /* Views and finishes are counted independently, and a reader who
     refreshes at the foot of a piece can be counted finished more often
     than they were counted arriving. The rate is capped rather than
     printed as 140%. */
  it('never reports more finishing than arriving', () => {
    expect(finishRateOf({ views: 10, finished: 14 })).toBe(1)
    expect(percent(finishRateOf({ views: 10, finished: 14 }))).toBe('100%')
  })

  it('is zero rather than infinite when nobody arrived', () => {
    expect(finishRateOf({ views: 0, finished: 3 })).toBe(0)
  })
})

describe('the machinery strip', () => {
  const sound: DeskHealth = {
    storeAttached: true,
    separateReviewKey: true,
    countingWorks: true,
    live: 14,
    pending: 0,
    altarsPlaced: 47,
    countiesTotal: 47,
  }

  it('says nothing alarming when everything is in place', () => {
    expect(healthNotes(sound).every((note) => note.level === 'good')).toBe(true)
  })

  it('puts the worst thing first', () => {
    const notes = healthNotes({ ...sound, storeAttached: false, separateReviewKey: false })
    expect(notes[0].level).toBe('bad')
    expect(notes[0].note).toContain('publishing will fail')
    expect(notes[1].level).toBe('warn')
  })

  it('says plainly what one shared key means', () => {
    const notes = healthNotes({ ...sound, separateReviewKey: false })
    expect(notes[0].note).toContain('Whoever writes can publish their own work')
  })

  it('counts the counties still without an altar', () => {
    const notes = healthNotes({ ...sound, altarsPlaced: 27 })
    expect(notes.some((note) => note.note.includes('20 of 47'))).toBe(true)
  })
})

describe('how the board prints things', () => {
  it('reads a stretch of time at the unit that says something', () => {
    expect(duration(45)).toBe('45s')
    expect(duration(600)).toBe('10m')
    expect(duration(9_000)).toBe('2.5h')
    expect(duration(180_000)).toBe('50h')
  })

  it('turns a heading anchor back into words', () => {
    expect(headingWords('what-repentance-costs')).toBe('What repentance costs')
  })

  it('calls no change level rather than nothing', () => {
    expect(change(0).text).toBe('level')
    expect(change(0.004).text).toBe('level')
  })
})


describe('narrowing the table', () => {
  /* The management list moved here from the posting desk, and it brought
     its filter with it — a writer's page has no business holding the
     controls for the whole archive. */
  const rows = pieceRows(
    [
      article('cross', { title: 'Why did Jesus have to die on the cross?', category: 'Doctrine' }),
      article('gospel', {
        title: 'Why the ministry rejects the prosperity gospel',
        category: 'Teachings',
        authorName: 'Simon Juma',
      }),
      article('dress', { title: 'Why no trousers, makeup or jewellery?', category: 'Teachings' }),
    ],
    [],
    []
  )

  it('leaves everything standing when nothing is asked', () => {
    expect(narrow(rows, '', EVERY_SECTION)).toHaveLength(3)
    expect(narrow(rows, '   ', EVERY_SECTION)).toHaveLength(3)
  })

  it('matches a title however it is typed', () => {
    expect(narrow(rows, 'PROSPERITY', EVERY_SECTION).map((r) => r.slug)).toEqual(['gospel'])
    expect(narrow(rows, 'jewellery', EVERY_SECTION).map((r) => r.slug)).toEqual(['dress'])
  })

  /* One box, not three. Somebody looking for "the prosperity piece Simon
     wrote" should find it by either half. */
  it('matches a byline and a section from the same box', () => {
    expect(narrow(rows, 'simon', EVERY_SECTION).map((r) => r.slug)).toEqual(['gospel'])
    expect(narrow(rows, 'doctrine', EVERY_SECTION).map((r) => r.slug)).toEqual(['cross'])
  })

  it('narrows to one section', () => {
    expect(narrow(rows, '', 'Teachings').map((r) => r.slug)).toEqual(['gospel', 'dress'])
  })

  it('takes a section and a search together', () => {
    expect(narrow(rows, 'why', 'Doctrine').map((r) => r.slug)).toEqual(['cross'])
    expect(narrow(rows, 'prosperity', 'Doctrine')).toEqual([])
  })

  it('counts the sections, largest first', () => {
    expect(sectionCounts(rows)).toEqual([
      { name: 'Teachings', n: 2 },
      { name: 'Doctrine', n: 1 },
    ])
  })

  it('counts nothing without falling over', () => {
    expect(sectionCounts([])).toEqual([])
    expect(narrow([], 'anything', EVERY_SECTION)).toEqual([])
  })

  /* The sentinel must never be mistaken for a real category, or a section
     genuinely named "all" would filter to nothing. */
  it('uses a section sentinel no category could be', () => {
    expect(EVERY_SECTION).not.toBe('All')
    expect(rows.every((row) => row.category !== EVERY_SECTION)).toBe(true)
  })
})
