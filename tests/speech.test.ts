import { describe, expect, it } from 'vitest'
import { chunk, clock } from '@/lib/speech'

/**
 * The chunking is the part of reading aloud that can be tested without a
 * voice: every engine truncates a long utterance, so a teaching handed
 * over in one piece is heard to stop in the middle of itself.
 */
describe('chunk', () => {
  it('keeps every piece short enough for an engine to finish', () => {
    const text = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} says something.`).join(' ')
    for (const part of chunk(text)) expect(part.length).toBeLessThanOrEqual(220)
  })

  it('loses no words', () => {
    const text = 'Repentance is the door. Holiness is the road! Is that not so? Yes.'
    expect(chunk(text).join(' ').replace(/\s+/g, ' ')).toBe(text)
  })

  it('breaks at sentences rather than mid-word', () => {
    const text = `${'A fairly long sentence about the rapture and the church. '.repeat(6)}`
    for (const part of chunk(text)) expect(part).toMatch(/[.!?]$/)
  })

  it('handles a body with no sentence enders at all', () => {
    const text = 'a'.repeat(500)
    expect(chunk(text).join('')).toBe(text)
  })

  it('returns nothing for nothing', () => {
    expect(chunk('')).toEqual([])
    expect(chunk('   ')).toEqual([])
  })
})

describe('clock', () => {
  it('reads as a clock', () => {
    expect(clock(0)).toBe('0:00')
    expect(clock(61)).toBe('1:01')
    expect(clock(372)).toBe('6:12')
  })

  it('never shows a negative', () => {
    expect(clock(-5)).toBe('0:00')
  })
})
