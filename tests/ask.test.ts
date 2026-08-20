import { beforeAll, describe, expect, it } from 'vitest'
import { allPassages, retrieve, sectionsOf } from '@/lib/ask/passages'
import { contextBlock, SYSTEM } from '@/lib/ask/prompt'
import { listRealRows } from '@/lib/rows'

/**
 * Retrieval decides what the model is allowed to know. Everything the
 * answer can say is in these passages, so the tests that matter are about
 * what gets in and what cannot.
 */

/* Read once, before the suite: a top-level await here type-checks only
   under a module setting this project does not use. */
let rows: Awaited<ReturnType<typeof listRealRows>> = []
let passages: ReturnType<typeof allPassages> = []

beforeAll(async () => {
  rows = await listRealRows()
  passages = allPassages(rows)
})

describe('cutting a teaching into chapters', () => {
  it('makes a passage of each chapter, anchored to it', () => {
    const row = rows.find((candidate) => candidate.body.includes('\n## '))!
    const sections = sectionsOf(row)
    expect(sections.length).toBeGreaterThan(1)
    const withHeading = sections.filter((section) => section.heading)
    expect(withHeading.length).toBeGreaterThan(0)
    for (const section of withHeading) expect(section.url).toContain('#')
  })

  it('keeps the opening, which belongs to no chapter', () => {
    const row = rows.find((candidate) => candidate.body.includes('\n## '))!
    const [first] = sectionsOf(row)
    expect(first.heading).toBeUndefined()
    expect(first.url).not.toContain('#')
  })

  it('hands over prose, not the desk’s markup', () => {
    for (const passage of passages) {
      expect(passage.text).not.toContain('## ')
      expect(passage.text).not.toContain('@video')
      expect(passage.text).not.toContain('::statement')
      expect(passage.text).not.toMatch(/\[[^\]]+\]\(\//)
    }
  })

  it('caps how much of one chapter goes over', () => {
    for (const passage of passages) expect(passage.text.length).toBeLessThanOrEqual(1401)
  })
})

describe('what the archive offers a question', () => {
  it('finds the teaching that answers it', () => {
    const found = retrieve(passages, 'why does God allow suffering?')
    expect(found.length).toBeGreaterThan(0)
    expect(found[0].title).toBe('Why does God allow suffering?')
  })

  it('reaches the prophetic record, not only the writing', () => {
    const found = retrieve(passages, 'colombia earthquake prophecy', 10)
    expect(found.some((passage) => passage.kind === 'prophecy-record')).toBe(true)
  })

  it('will not let one teaching answer everything', () => {
    const found = retrieve(passages, 'holiness', 6)
    const counts = new Map<string, number>()
    for (const passage of found) counts.set(passage.title, (counts.get(passage.title) ?? 0) + 1)
    for (const count of Array.from(counts.values())) expect(count).toBeLessThanOrEqual(2)
  })

  it('returns nothing when the archive holds nothing on it', () => {
    expect(retrieve(passages, 'zzzznothinghere')).toHaveLength(0)
  })

  it('never returns more than it was asked for', () => {
    expect(retrieve(passages, 'the rapture', 3).length).toBeLessThanOrEqual(3)
  })
})

describe('what the model is told', () => {
  it('refuses it every source but the passages', () => {
    expect(SYSTEM).toContain('only from the passages')
    expect(SYSTEM).toContain('not a source')
  })

  it('requires citations and admits ignorance', () => {
    expect(SYSTEM).toContain('[1]')
    expect(SYSTEM.toLowerCase()).toContain('say so plainly')
  })

  it('keeps the ministry’s designation from becoming a verdict', () => {
    expect(SYSTEM).toContain("ministry's own designation")
  })

  it('sends a crisis to a person', () => {
    expect(SYSTEM).toContain('not a counsellor')
    expect(SYSTEM).toContain('pastoral')
  })

  it('numbers the passages the way the answer cites them', () => {
    const block = contextBlock(retrieve(passages, 'the rapture', 3))
    expect(block).toContain('[1]')
    expect(block).toContain('[2]')
    expect(block.indexOf('[1]')).toBeLessThan(block.indexOf('[2]'))
  })

  it('names a chapter with the teaching it came from', () => {
    const withHeading = passages.find((passage) => passage.heading)!
    expect(contextBlock([withHeading])).toContain(`${withHeading.title} — ${withHeading.heading}`)
  })

  it('bounds what one question can cost', () => {
    const block = contextBlock(retrieve(passages, 'holiness repentance rapture', 6))
    /* Six passages at 1400 characters is the ceiling, and roughly two
       thousand tokens — the cost of a question, fixed by construction. */
    expect(block.length).toBeLessThan(9000)
  })
})
