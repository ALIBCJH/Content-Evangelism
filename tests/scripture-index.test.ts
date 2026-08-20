import { beforeAll, describe, expect, it } from 'vitest'
import { buildScriptureIndex, refKey, versesFor, type Verse } from '@/lib/scripture-index'
import { scriptureRefs } from '@/lib/scripture'
import { listRealRows, type RealRow } from '@/lib/rows'

/**
 * The archive as its own concordance. What matters is that a reference in
 * the rail finds the passage a teaching actually set out — and that it
 * never finds the wrong one.
 */

let rows: RealRow[] = []
let index: Map<string, Verse> = new Map()

beforeAll(async () => {
  rows = await listRealRows()
  index = buildScriptureIndex(rows)
})

describe('matching a reference to a passage', () => {
  it('reads the same reference written several ways', () => {
    const written = ['Romans 6:23', 'ROMANS 6:23', 'Romans 6:23, KJV', 'romans 6 : 23', 'Romans 6:23.']
    const keys = new Set(written.map(refKey))
    expect(keys.size).toBe(1)
  })

  it('keeps two different verses apart', () => {
    expect(refKey('Romans 6:23')).not.toBe(refKey('Romans 6:2'))
    expect(refKey('Isaiah 40:3')).not.toBe(refKey('Isaiah 4:3'))
    expect(refKey('1 Thessalonians 4:17')).not.toBe(refKey('2 Thessalonians 4:17'))
  })
})

describe('what the archive has set out', () => {
  it('finds passages in the teachings themselves', () => {
    expect(index.size).toBeGreaterThan(5)
  })

  it('carries the words, the citation, and where they came from', () => {
    const [verse] = Array.from(index.values())
    expect(verse.text.length).toBeGreaterThan(15)
    expect(verse.cite).toBeTruthy()
    expect(verse.title).toBeTruthy()
    expect(verse.href).toMatch(/^\/articles\//)
  })

  it('hands the rail only the references it asked about', () => {
    const row = rows[0]
    const refs = scriptureRefs(row.body, 12)
    const found = versesFor(index, refs)
    for (const key of Object.keys(found)) expect(refs).toContain(key)
  })

  it('answers for at least some of a teaching’s own references', () => {
    /* A teaching that quotes a verse in full and then cites it should be
       able to show that verse. If this ever returns nothing for every
       piece, the citation format and the reference format have drifted
       apart and the rail has quietly stopped answering. */
    const answered = rows.filter(
      (row) => Object.keys(versesFor(index, scriptureRefs(row.body, 12))).length > 0
    )
    expect(answered.length).toBeGreaterThan(0)
  })

  it('says nothing for a reference nothing quotes', () => {
    expect(versesFor(index, ['Habakkuk 2:20'])['Habakkuk 2:20']).toBeUndefined()
  })
})
