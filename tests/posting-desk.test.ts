import { describe, expect, it } from 'vitest'
import { applySnippet, GRAMMAR, SNIPPETS } from '@/lib/markup-snippets'
import { parseBody } from '@/lib/article-body'
import { worthKeeping } from '@/lib/draft'

/**
 * The desk's buttons write the body grammar. If the parser ever moves and
 * the buttons do not, a writer presses "table" and publishes a paragraph
 * of pipes — so every button is put through the parser here.
 */
describe('what the desk’s buttons produce', () => {
  const withSample = SNIPPETS.filter((snippet) => snippet.produces)

  it('covers the blocks a teaching is built from', () => {
    const kinds = withSample.map((snippet) => snippet.produces!.kind)
    for (const kind of ['heading', 'quote', 'list', 'table', 'callout', 'video', 'figure', 'related', 'faq']) {
      expect(kinds, kind).toContain(kind)
    }
  })

  it.each(withSample.map((snippet) => [snippet.label, snippet] as const))(
    '%s parses as the block it is named after',
    (_label, snippet) => {
      const { text } = applySnippet('', 0, 0, snippet)
      const filled = text.replace(snippet.before, `${snippet.before}${snippet.produces!.sample}`)
      const [block] = parseBody(filled)
      expect(block.kind).toBe(snippet.produces!.kind)
    }
  )

  it('writes the inline ones as inline markup, not as blocks', () => {
    for (const label of ['link', 'bold']) {
      const snippet = SNIPPETS.find((candidate) => candidate.label === label)!
      const { text } = applySnippet('A sentence with ', 16, 16, snippet)
      const [block] = parseBody(`${text.replace(snippet.after, `the rapture${snippet.after}`)} in it.`)
      expect(block.kind).toBe('paragraph')
    }
  })
})

describe('applySnippet', () => {
  it('keeps what was selected inside the markup', () => {
    const bold = SNIPPETS.find((snippet) => snippet.label === 'bold')!
    const { text } = applySnippet('make this bold', 5, 14, bold)
    expect(text).toBe('make **this bold**')
  })

  it('leaves the cursor where the writing continues', () => {
    const heading = SNIPPETS.find((snippet) => snippet.label === '##')!
    const { text, caret } = applySnippet('', 0, 0, heading)
    expect(text.startsWith('## ')).toBe(true)
    expect(caret).toBe(3)
  })

  it('inserts into the middle of a body without disturbing it', () => {
    const heading = SNIPPETS.find((snippet) => snippet.label === '##')!
    const body = 'First paragraph.\n\nSecond paragraph.'
    const { text } = applySnippet(body, 18, 18, heading)
    expect(text).toContain('First paragraph.')
    expect(text).toContain('Second paragraph.')
    expect(text).toContain('## ')
  })
})

describe('the grammar reference', () => {
  it('documents every button, and then some', () => {
    expect(GRAMMAR.length).toBeGreaterThanOrEqual(SNIPPETS.length)
  })

  it('names the blocks that have no button of their own', () => {
    const documented = GRAMMAR.map((row) => row.how).join('\n')
    expect(documented).toContain('@diagram')
    expect(documented).toContain('::note')
  })
})

describe('a held draft', () => {
  const empty = {
    editingSlug: null,
    title: '',
    category: 'Teachings',
    dek: '',
    body: '',
    authorName: '',
    imageUrl: '',
    imageAlt: '',
    tags: '',
  }

  it('is not worth keeping when there is nothing in it', () => {
    expect(worthKeeping(empty)).toBe(false)
    expect(worthKeeping({ ...empty, title: '   ' })).toBe(false)
    /* A category alone is the form's default, not somebody's work. */
    expect(worthKeeping({ ...empty, category: 'Doctrine' })).toBe(false)
  })

  it('is worth keeping the moment there are words in it', () => {
    expect(worthKeeping({ ...empty, title: 'Why the cross' })).toBe(true)
    expect(worthKeeping({ ...empty, body: 'The opening paragraph.' })).toBe(true)
    expect(worthKeeping({ ...empty, dek: 'One sentence.' })).toBe(true)
  })
})
