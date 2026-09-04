import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { bodyToPlainText, parseBody, parseInline } from '@/lib/article-body'
import { ArticleProse } from '@/components/article-prose'
import { GLOSSARY, lookUp } from '@/lib/glossary'

/**
 * Terms that explain themselves, and marks that point at the Sources.
 *
 * Both exist for one page — twenty years of laboratory work, whose whole
 * argument is that the record can be checked. A reader cannot check what
 * they cannot read, and cannot follow a citation that is a bare digit
 * glued to the end of a word.
 */

const term = (text: string) => parseInline(text).find((i) => i.kind === 'term')

describe('a technical term that explains itself', () => {
  it('is looked up by its own words', () => {
    expect(term('the {{Nrf2}} protein')).toMatchObject({
      kind: 'term',
      text: 'Nrf2',
      entry: GLOSSARY.nrf2,
    })
  })

  it('lets a different word point at the same entry', () => {
    expect(term('{{destroys itself|apoptosis}}')).toMatchObject({
      kind: 'term',
      text: 'destroys itself',
      entry: GLOSSARY.apoptosis,
    })
  })

  /* A glossary that silently swallowed a paragraph because somebody
     mistyped a key would be worse than no glossary. */
  it('falls back to plain words when nothing is behind it', () => {
    const inlines = parseInline('a {{term nobody defined}} here')
    expect(inlines.some((i) => i.kind === 'term')).toBe(false)
    expect(inlines.map((i) => (i.kind === 'ref' ? '' : i.text)).join('')).toBe(
      'a term nobody defined here'
    )
  })

  it('is a control a keyboard and a finger can both reach', () => {
    const html = renderToStaticMarkup(<ArticleProse body="Stress releases {{Nrf2}}." />)
    expect(html).toContain('<button')
    expect(html).toContain('aria-expanded="false"')
  })

  it('keys are normalised, so casing and spacing cannot miss', () => {
    expect(lookUp('DNA Sequencing')).toBe(GLOSSARY['dna-sequencing'])
    expect(lookUp('  peer-reviewed ')).toBe(GLOSSARY['peer-reviewed'])
  })

  it('says something in every entry it holds', () => {
    for (const [key, entry] of Object.entries(GLOSSARY)) {
      expect(entry.term.length, key).toBeGreaterThan(2)
      expect(entry.gloss.length, key).toBeGreaterThan(80)
    }
  })
})

describe('a reference mark', () => {
  it('is a number pointing at the Sources list', () => {
    expect(parseInline('printed on the paper.[^4]').at(-1)).toMatchObject({ kind: 'ref', n: 4 })
  })

  it('is drawn as a reference is drawn in print, and links to the list', () => {
    const html = renderToStaticMarkup(<ArticleProse body={'A claim.[^4]\n\n## Sources'} />)
    expect(html).toContain('<sup')
    expect(html).toContain('href="#sources"')
    /* The heading the mark points at has to be the one the body writes. */
    expect(parseBody('## Sources')[0]).toMatchObject({ kind: 'heading', id: 'sources' })
  })

  /* A bare "4" dropped into a sentence would otherwise reach the feed,
     the search haystack and the structured data as if it were a word. */
  it('contributes no words to the plain text of the article', () => {
    expect(bodyToPlainText('The state provided transport.[^9]')).not.toContain('9')
  })
})
