import { describe, expect, it } from 'vitest'
import {
  BEGIN_DEPTH,
  BEGIN_SECONDS,
  FINISH_DEPTH,
  PROMPT_SECONDS,
  hasBegun,
  hasFinished,
  reachedTheEnd,
  secondsToFinish,
} from '@/lib/reading-rule'

/**
 * The one rule both trackers ask.
 *
 * It exists because they used to answer it separately and neither
 * consulted the clock: the ministry's counters called a teaching
 * finished at nine tenths of scroll depth, the reader's own shelf at
 * ninety-five hundredths, and a twelve-minute teaching flicked to the
 * bottom in three seconds satisfied both.
 */

describe('read: the end of the body, and the time to have read it', () => {
  it('refuses the flick — the whole page, and no time in it', () => {
    expect(hasFinished(1, 3, 12)).toBe(false)
    expect(hasFinished(1, 19, 0.1)).toBe(false)
  })

  it('refuses the other half too — all the time, none of the page', () => {
    /* A tab left open on a teaching somebody stopped reading in the
       third paragraph. */
    expect(hasFinished(0.2, 3600, 10)).toBe(false)
  })

  it('takes a reader who reached the end and spent the time', () => {
    expect(hasFinished(FINISH_DEPTH, 210, 10)).toBe(true)
    expect(hasFinished(1, 600, 10)).toBe(true)
  })

  it('takes a fast reader, which is the point of a third rather than all', () => {
    /* Ten minutes is words over two hundred; plenty of people read at
       three hundred and would finish this in seven. Demanding the whole
       estimate would call that reader unfinished. */
    expect(hasFinished(1, 7 * 60, 10)).toBe(true)
    /* And a genuine skimmer who spent four minutes on it. */
    expect(hasFinished(1, 4 * 60, 10)).toBe(true)
  })
})

describe('how long a teaching asks for', () => {
  it('scales with its length', () => {
    expect(secondsToFinish(10)).toBe(210)
    expect(secondsToFinish(6)).toBe(126)
    expect(secondsToFinish(3)).toBe(63)
  })

  it('never asks for nothing, however short', () => {
    /* Otherwise a one-line teaching would be read by loading the page. */
    expect(secondsToFinish(1)).toBe(21)
    expect(secondsToFinish(0.2)).toBe(20)
    expect(secondsToFinish(0)).toBe(20)
    expect(secondsToFinish(-5)).toBe(20)
  })
})

describe('begun: far enough in, and long enough there', () => {
  it('refuses a page opened and nudged', () => {
    expect(hasBegun(0.4, 4)).toBe(false)
    expect(hasBegun(0.02, 600)).toBe(false)
  })

  it('takes a reader who is actually into it', () => {
    expect(hasBegun(BEGIN_DEPTH, BEGIN_SECONDS)).toBe(true)
    expect(hasBegun(0.4, 60)).toBe(true)
  })
})

describe('what the prompt asks for, which is much less', () => {
  /* Two different questions. `hasFinished` decides what the archive
     records and has to be strict, because a count that treats flicks as
     readings lies to the ministry about its own work. This decides
     whether to offer somebody a heart, where being strict costs a fast
     reader the only moment they had to say yes and being generous costs
     nothing at all. */

  it('offers the question to anyone who has scrolled through', () => {
    /* Twelve minutes of teaching, read at speed in ninety seconds. The
       counter will not call this finished, and it should not — but the
       reader still reached the end and should still be asked. */
    expect(reachedTheEnd(1, 90)).toBe(true)
    expect(hasFinished(1, 90, 12)).toBe(false)
  })

  it('still keeps a thumb out', () => {
    expect(reachedTheEnd(1, 3)).toBe(false)
    expect(reachedTheEnd(1, PROMPT_SECONDS - 1)).toBe(false)
    expect(reachedTheEnd(1, PROMPT_SECONDS)).toBe(true)
  })

  it('asks nothing of a reader who has not reached the end', () => {
    expect(reachedTheEnd(FINISH_DEPTH - 0.01, 3600)).toBe(false)
  })
})
