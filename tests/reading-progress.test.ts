import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  forget,
  forgetAll,
  isFinished,
  mark,
  minutesLeft,
  percentRead,
  unfinished,
} from '@/lib/reading-progress'
import { FINISH_DEPTH, secondsToFinish } from '@/lib/reading-rule'
import { progressThrough } from '@/components/progress-bar'

/* The modules above touch `window` only when called, so the fake below is
   in place long before anything reads it. */

/**
 * What this browser remembers about what was read.
 *
 * The module talks to `window.localStorage` and nothing else, so a fake
 * one is the whole environment it needs. What is worth guarding is the
 * pair of rules a reading history stands on: a piece read to the end is
 * kept and said to be read, and the furthest point reached is the point
 * that is kept — a reader who scrolls back up to check a verse on their
 * way out has not un-read the teaching.
 */

const store = new Map<string, string>()

vi.stubGlobal('window', {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  },
  dispatchEvent: () => true,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
})
vi.stubGlobal('StorageEvent', class {})



const KEY = 'reading-progress'
const held = () =>
  JSON.parse(store.get(KEY) ?? '[]') as {
    slug: string
    progress: number
    seconds: number
    readMinutes: number
  }[]

/* Ten minutes of teaching, and by default long enough spent in it to
   have read it: `secondsToFinish(10)` is 210, so 600 clears the bar with
   room to spare. Tests about the clock pass their own. */
const piece = (slug: string, progress: number, seconds = 600) => ({
  slug,
  title: `The teaching called ${slug}`,
  href: `/articles/${slug}`,
  readMinutes: 10,
  progress,
  seconds,
})

beforeEach(() => store.clear())

describe('what is kept', () => {
  it('keeps a teaching a reader is part way through', () => {
    mark(piece('repentance', 0.4))
    expect(held()).toHaveLength(1)
    expect(held()[0].progress).toBeCloseTo(0.4)
  })

  it('keeps a teaching read to the end, rather than throwing it away', () => {
    /* The bug this feature had: finishing something removed every trace
       of it, so the history could show what a reader abandoned and never
       what they read. */
    mark(piece('repentance', 1))
    expect(held()).toHaveLength(1)
    expect(isFinished(held()[0])).toBe(true)
  })

  it('does not keep a page that was merely opened', () => {
    mark(piece('repentance', 0.02))
    expect(held()).toHaveLength(0)
  })

  it('keeps the furthest point reached, not the last one seen', () => {
    mark(piece('repentance', 0.75))
    /* Scrolling back to re-read a paragraph, then leaving. */
    mark(piece('repentance', 0.2))
    expect(held()[0].progress).toBeCloseTo(0.75)
  })

  it('leaves a finished teaching finished', () => {
    mark(piece('repentance', 1))
    mark(piece('repentance', 0.1))
    expect(isFinished(held()[0])).toBe(true)
  })

  it('never records more than the whole of a piece', () => {
    mark(piece('repentance', 4))
    expect(held()[0].progress).toBe(1)
  })

  it('puts the most recent first, and holds one entry per teaching', () => {
    mark(piece('first', 0.3))
    mark(piece('second', 0.3))
    mark(piece('first', 0.5))
    expect(held().map((entry) => entry.slug)).toEqual(['first', 'second'])
  })

  it('lets a reader throw one away, or all of them', () => {
    mark(piece('first', 0.3))
    mark(piece('second', 0.3))
    forget('first')
    expect(held().map((entry) => entry.slug)).toEqual(['second'])
    forgetAll()
    expect(held()).toHaveLength(0)
  })
})

describe('the clock, not only the scrollbar', () => {
  /* The rule this file exists to guard now. Scroll depth on its own said
     a twelve-minute teaching flicked to the bottom in three seconds had
     been read, and the shelf kept the furthest point reached — so one
     accidental flick marked it read for good. */

  it('does not put a three-second flick on the shelf at all', () => {
    /* The whole teaching went past the fold and nothing was read. It is
       not finished, and it is not even begun. */
    mark(piece('flicked', 1, 3))
    expect(held()).toHaveLength(0)
  })

  it('keeps a teaching reached the end of but not spent time in, unfinished', () => {
    mark(piece('skimmed', 1, 15))
    expect(held()).toHaveLength(1)
    expect(isFinished(held()[0])).toBe(false)
  })

  it('calls it read once the reader has actually spent the time', () => {
    mark(piece('skimmed', 1, 15))
    expect(isFinished(held()[0])).toBe(false)
    /* Back again, and this time they read it. */
    mark(piece('skimmed', 1, 300))
    expect(isFinished(held()[0])).toBe(true)
  })

  it('adds up the sittings rather than taking the last one', () => {
    mark(piece('long', 0.4, 120))
    mark(piece('long', 1, 120))
    expect(held()[0].seconds).toBe(240)
    /* 240 clears the 210 a ten-minute teaching asks for. */
    expect(isFinished(held()[0])).toBe(true)
  })

  it('asks less of a short teaching than a long one, but never nothing', () => {
    expect(secondsToFinish(10)).toBe(210)
    expect(secondsToFinish(3)).toBe(63)
    expect(secondsToFinish(1)).toBe(21)
    /* The floor: a one-line teaching still has to be looked at. */
    expect(secondsToFinish(0.5)).toBe(20)
    expect(secondsToFinish(0)).toBe(20)
  })

  it('does not open the shelf for a page opened and nudged', () => {
    mark(piece('glanced', 0.3, 4))
    expect(held()).toHaveLength(0)
  })

  it('judges a mark written before there was a clock the old way', () => {
    /* A reader's existing shelf. Telling them on their next visit that
       they have not read four teachings they know they read is a worse
       answer than a generous one about a handful of old marks. */
    expect(isFinished({ progress: 0.96, readMinutes: 10 })).toBe(true)
    expect(isFinished({ progress: 0.5, readMinutes: 10 })).toBe(false)
  })
})

describe('what is offered back', () => {
  it('offers what is unfinished and not what is read', () => {
    const marks = [
      { ...piece('read-it', 1), at: 2 },
      { ...piece('half-way', 0.5), at: 1 },
    ]
    expect(unfinished(marks).map((entry) => entry.slug)).toEqual(['half-way'])
  })
})

describe('what the shelf prints', () => {
  it('says 100% only for a teaching actually finished', () => {
    const read = { readMinutes: 10, seconds: 600 }
    expect(percentRead({ ...read, progress: 1 })).toBe(100)
    expect(percentRead({ ...read, progress: FINISH_DEPTH })).toBe(100)
    /* Short of the finishing line, and it must not round up into a
       claim: an unfinished teaching cannot print a hundred. */
    expect(percentRead({ ...read, progress: 0.5 })).toBe(50)
    expect(percentRead({ ...read, progress: 0.899 })).toBe(90)

    /* At the end of the body but barely any time in it — the flick. The
       depth prints, the claim does not. */
    expect(percentRead({ readMinutes: 10, seconds: 3, progress: 1 })).toBe(99)
  })

  it('says what is left, and never says none', () => {
    expect(minutesLeft({ progress: 0.5, readMinutes: 10 })).toBe(5)
    expect(minutesLeft({ progress: 0.99, readMinutes: 10 })).toBe(1)
  })
})

describe('how far through a teaching a reader is', () => {
  /* Real geometry, measured in a browser on "Why does God allow
     suffering?" at 1440×900: the writing is 9,019px of a 13,134px
     document. The rest is Read Next, the rails, the ask-a-question
     section and the footer — everything a reader has finished the
     teaching without reading. */
  const TEACHING = { top: 347, height: 9_019 }
  const PAGE_AFTER_IT = 3_768
  const VIEWPORT = 900

  const throughTheTeaching = (scrollY: number) =>
    progressThrough({ ...TEACHING, scrollY, viewport: VIEWPORT })

  const throughTheDocument = (scrollY: number) =>
    progressThrough({
      top: 0,
      height: TEACHING.top + TEACHING.height + PAGE_AFTER_IT,
      scrollY,
      viewport: VIEWPORT,
    })

  /** Where the reader is when they are half way down the writing. */
  const HALF_WAY = TEACHING.top + (TEACHING.height - VIEWPORT) / 2
  /** Where they are at the last line of it. */
  const LAST_LINE = TEACHING.top + TEACHING.height - VIEWPORT

  it('reads half way as half way, where the page read it as a third', () => {
    expect(throughTheTeaching(HALF_WAY)).toBeCloseTo(0.5, 2)
    expect(Math.round(throughTheDocument(HALF_WAY) * 100)).toBe(36)
  })

  it('reads the last line of the teaching as finished', () => {
    expect(throughTheTeaching(LAST_LINE)).toBe(1)
    expect(throughTheTeaching(LAST_LINE)).toBeGreaterThanOrEqual(FINISH_DEPTH)

    /* What it did before: the reader had read every word and the page
       said 69%, which is not a rounding error — it is the ask form and
       the footer counted as part of the teaching. The finished mark was
       therefore unreachable by reading. */
    expect(Math.round(throughTheDocument(LAST_LINE) * 100)).toBe(69)
    expect(throughTheDocument(LAST_LINE)).toBeLessThan(FINISH_DEPTH)
  })

  it('is nothing at the top and never more than everything', () => {
    expect(throughTheTeaching(0)).toBe(0)
    expect(throughTheTeaching(TEACHING.top)).toBe(0)
    expect(throughTheTeaching(999_999)).toBe(1)
  })

  it('counts a teaching shorter than the window, once it has all been seen', () => {
    const short = { top: 400, height: 600, viewport: 900 }
    expect(progressThrough({ ...short, scrollY: 0 })).toBe(0)
    /* Scrolled far enough that its last line is on screen. */
    expect(progressThrough({ ...short, scrollY: 100 })).toBe(1)
  })
})
