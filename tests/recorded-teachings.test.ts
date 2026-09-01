import { describe, expect, it } from 'vitest'
import {
  dateline,
  isoDuration,
  runtime,
  runtimeInWords,
  teachingRecordings,
} from '@/lib/teachings'

/**
 * The shelf of recorded teachings.
 *
 * Six of these seven once carried a headline and nothing else: no
 * summary, no runtime, and five of them no date at all — the page showed
 * a four-hour conference and a six-minute message as the same object. The
 * facts are now the ministry's own, taken from its own channel, and these
 * are the rules that keep them that way.
 */

/** 'AUGUST 8, 2026' → a day, so the order can be checked. */
const day = (dated: string): number => Date.parse(dated.replace(/^PUBLISHED /, ''))

describe('every recording carries what a reader needs', () => {
  it('says what it is', () => {
    for (const recording of teachingRecordings) {
      expect(recording.summary.length, recording.id).toBeGreaterThan(40)
    }
  })

  it('says how long it is', () => {
    for (const recording of teachingRecordings) {
      expect(recording.seconds, recording.id).toBeGreaterThan(0)
    }
  })

  it('says when, and which kind of when', () => {
    for (const recording of teachingRecordings) {
      expect(Number.isNaN(day(recording.date)), recording.id).toBe(false)
      /* The year on the rail is the year of the dateline above it. */
      expect(recording.date, recording.id).toContain(recording.year)
      expect(Number.isNaN(Date.parse(recording.uploaded)), recording.id).toBe(false)
    }
  })

  it('never claims a preaching date it was not given', () => {
    for (const recording of teachingRecordings) {
      const shown = dateline(recording)
      expect(shown.startsWith('PUBLISHED '), recording.id).toBe(
        recording.dated === 'published'
      )
    }
  })

  it('holds each recording once', () => {
    const ids = teachingRecordings.map((recording) => recording.id)
    const videos = teachingRecordings.map((recording) => recording.video)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(videos).size).toBe(videos.length)
  })

  it('runs newest first', () => {
    const days = teachingRecordings.map((recording) => day(recording.date))
    expect(days).toEqual([...days].sort((a, b) => b - a))
  })
})

describe('the runtime, said three ways', () => {
  it('is a clock a reader already knows how to read', () => {
    expect(runtime(347)).toBe('5:47')
    expect(runtime(482)).toBe('8:02')
    expect(runtime(6932)).toBe('1:55:32')
    expect(runtime(13986)).toBe('3:53:06')
  })

  it('is words where a clock would read as a time of day', () => {
    expect(runtimeInWords(425)).toBe('7 minutes')
    expect(runtimeInWords(3600)).toBe('1 hour')
    expect(runtimeInWords(9493)).toBe('2 hours 38 minutes')
  })

  it('is ISO 8601 where a search engine is reading', () => {
    expect(isoDuration(347)).toBe('PT5M47S')
    expect(isoDuration(6932)).toBe('PT1H55M32S')
  })
})
