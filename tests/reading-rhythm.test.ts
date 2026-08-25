import { describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { parseBody, type Block } from '@/lib/article-body'
import { PARAGRAPHS_BETWEEN_PLATES, platedQuotes } from '@/lib/scripture-rhythm'
import { minutesLeft, showsTimeLeft } from '@/components/progress-bar'

/**
 * Two things that make a long teaching readable: a rest in the scroll,
 * and an honest answer to "how much longer".
 *
 * A teaching here runs eight to eleven minutes, and the pieces carry
 * stretches of six and seven paragraphs with nothing to rest the eye on.
 * Some passages are promoted to the plate the front page's lead card
 * opens on — and the whole risk in that idea is doing it too often, so
 * most of what is held to here is restraint.
 */

const para = (): Block => ({ kind: 'paragraph', inlines: [{ kind: 'text', text: 'x' }] })
const quote = (): Block => ({ kind: 'quote', inlines: [{ kind: 'text', text: 'q' }] })
const heading = (): Block => ({ kind: 'heading', text: 'H', id: 'h', level: 2 }) as Block

const run = (n: number) => Array.from({ length: n }, para)

describe('which passages become a rest', () => {
  it('leaves a passage inline until enough reading has passed', () => {
    const blocks = [...run(PARAGRAPHS_BETWEEN_PLATES - 1), quote()]
    expect(platedQuotes(blocks).size).toBe(0)
  })

  it('promotes one once it has', () => {
    const blocks = [...run(PARAGRAPHS_BETWEEN_PLATES), quote()]
    expect(Array.from(platedQuotes(blocks))).toEqual([PARAGRAPHS_BETWEEN_PLATES])
  })

  /* The whole risk in the idea. A plate under every quotation is the
     wallpaper it was meant to interrupt. */
  it('never sets two passages in a row on the plate', () => {
    const blocks = [...run(10), quote(), quote(), quote()]
    expect(platedQuotes(blocks).size).toBe(1)
  })

  it('starts counting at the top, so a teaching never opens on one', () => {
    expect(platedQuotes([quote(), ...run(20)]).size).toBe(0)
  })

  /* A heading is a smaller break than a plate. Zeroing the distance on
     each one would push the next plate out past where it was wanted. */
  it('does not let a heading cancel the distance travelled', () => {
    const blocks = [...run(3), heading(), ...run(3), quote()]
    expect(platedQuotes(blocks).size).toBe(1)
  })

  it('spaces them out rather than clustering after one long stretch', () => {
    const blocks = [...run(6), quote(), para(), quote(), ...run(6), quote()]
    expect(Array.from(platedQuotes(blocks))).toEqual([6, 15])
  })
})

describe('against the teachings actually published', () => {
  it('gives a long piece a rest without turning the page into plates', async () => {
    const raw = await fs.readFile(path.join(process.cwd(), 'data', 'articles.json'), 'utf8')
    const live = (JSON.parse(raw) as { body: string; status?: string; readMinutes: number }[])
      .filter((a) => a.status !== 'pending')
    expect(live.length).toBeGreaterThan(0)

    for (const piece of live) {
      const blocks = parseBody(piece.body)
      const plates = Array.from(platedQuotes(blocks))

      /* Roughly one every three minutes at the very most. */
      expect(plates.length).toBeLessThanOrEqual(Math.ceil(piece.readMinutes / 3))

      /* What actually keeps a plate a rest is the reading between one and
         the next — not what share of the passages were promoted. A piece
         quoting sparingly may have most of its quotations on the plate
         and still read as a rest every few minutes, which is the point;
         what must never happen is two of them close together. */
      for (let n = 1; n < plates.length; n += 1) {
        const between = blocks
          .slice(plates[n - 1] + 1, plates[n])
          .filter((b) => b.kind === 'paragraph').length
        expect(between).toBeGreaterThanOrEqual(PARAGRAPHS_BETWEEN_PLATES)
      }
    }
  })
})

describe('how much is left', () => {
  it('counts down rather than up', () => {
    expect(minutesLeft(10, 0)).toBe(10)
    expect(minutesLeft(10, 0.5)).toBe(5)
    expect(minutesLeft(10, 0.9)).toBe(1)
  })

  /* "0 min left" in front of three remaining paragraphs is the site
     telling a reader something they can see is untrue. */
  it('never says nothing is left while something is', () => {
    expect(minutesLeft(10, 0.99)).toBe(1)
    expect(minutesLeft(3, 0.999)).toBe(1)
  })

  it('holds up against a progress reading outside its range', () => {
    expect(minutesLeft(10, -1)).toBe(10)
    expect(minutesLeft(10, 2)).toBe(1)
  })

  /* Not at the top, where it repeats the reading time the piece already
     prints. Not at the end, where it would sit over the last lines. */
  it('is shown only where somebody is actually deciding', () => {
    expect(showsTimeLeft(0)).toBe(false)
    expect(showsTimeLeft(0.03)).toBe(false)
    expect(showsTimeLeft(0.4)).toBe(true)
    expect(showsTimeLeft(0.97)).toBe(false)
    expect(showsTimeLeft(1)).toBe(false)
  })
})
