import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ArticleMasthead } from '@/components/article-masthead'
import { ChapterBar } from '@/components/chapter-bar'
import { ArticleProse } from '@/components/article-prose'
import type { Category } from '@/lib/content'
import type { Heading } from '@/lib/toc'

/**
 * The head of a teaching, and the strip that travels with the reader.
 *
 * What is held to here is mostly what the page must *say*, not how it
 * looks. Three of these are claims the old page got wrong and could get
 * wrong again: that the author and the date are at the top, where trust
 * is decided rather than after it no longer matters; that the desk's
 * verdict states either answer rather than only the flattering one; and
 * that the opening of a teaching carries the initial, which is the one
 * thing standing in for the picture that is no longer here.
 */

const article = {
  slug: 'why-does-god-allow-suffering',
  category: 'Doctrine' as Category,
  title: 'Why does God allow suffering?',
  dek: 'Scripture does not explain every tragedy, and never pretends to.',
  publishedAt: '2026-08-17T09:00:00.000Z',
  readMinutes: 11,
}

describe('the masthead of a teaching', () => {
  /* The whole reason it moved. A reader arriving from a search result has
     never heard of this ministry, and decides whether to believe the page
     before the first paragraph rather than after the last. */
  it('carries the byline and the date above the writing', () => {
    const html = renderToStaticMarkup(
      <ArticleMasthead
        {...article}
        author={{ name: 'Grace Wanjiru', href: '/authors/grace-wanjiru' }}
      />
    )
    expect(html).toContain('Grace Wanjiru')
    expect(html).toContain('/authors/grace-wanjiru')
    expect(html).toContain('rel="author"')
    expect(html).toContain('17 August 2026')
    expect(html).toContain('11')
  })

  it('names the section, and links to it', () => {
    const html = renderToStaticMarkup(
      <ArticleMasthead {...article} author={{ name: 'The Editorial Desk' }} />
    )
    expect(html).toContain('Doctrine')
    expect(html).toContain('/topics/doctrine')
  })

  it('sets the headline and the standfirst', () => {
    const html = renderToStaticMarkup(
      <ArticleMasthead {...article} author={{ name: 'The Editorial Desk' }} />
    )
    expect(html).toContain('Why does God allow suffering?')
    expect(html).toContain('never pretends to')
  })

  /* A page that marks only what it has checked leaves a reader to work
     out what the silence on every other page means. */
  it('states either verdict rather than only the good one', () => {
    const checked = renderToStaticMarkup(
      <ArticleMasthead {...article} author={{ name: 'The Editorial Desk' }} verified />
    )
    const not = renderToStaticMarkup(
      <ArticleMasthead {...article} author={{ name: 'The Editorial Desk' }} />
    )
    expect(checked).toContain('Verified')
    expect(not).toContain('Not verified')
  })

  /* It was a gold button in the top right of every teaching, competing
     with the headline and offering a reader who had just arrived a way to
     leave. The site's own masthead is directly above it. */
  it('does not offer the way back out before the reader is in', () => {
    const html = renderToStaticMarkup(
      <ArticleMasthead {...article} author={{ name: 'The Editorial Desk' }} />
    )
    expect(html).not.toContain('All articles')
  })

  it('does not sign a byline with a link it has no page for', () => {
    const html = renderToStaticMarkup(
      <ArticleMasthead {...article} author={{ name: 'The Editorial Desk' }} />
    )
    expect(html).toContain('The Editorial Desk')
    expect(html).not.toContain('rel="author"')
  })
})

const headings: Heading[] = [
  { id: 'is-god-good', text: 'Does suffering mean that God is not good?' },
  { id: 'asking-why', text: 'Is asking “why” a failure of faith?' },
  { id: 'a-purpose', text: 'Does suffering have a purpose?' },
]

describe('the chapter strip', () => {
  it('lists every chapter, numbered, each an anchor', () => {
    const html = renderToStaticMarkup(
      <ChapterBar headings={headings} targetId="the-teaching" readMinutes={11} />
    )
    expect(html).toContain('#is-god-good')
    expect(html).toContain('#a-purpose')
    expect(html).toContain('Does suffering have a purpose?')
  })

  /* A teaching with one chapter has no chapters, so the strip carries no
     chapter — it used to render nothing at all, and now it still carries
     the way out. A control a reader can only find on some pages is not a
     control they can find. */
  it('drops the chapter list from a teaching that has no chapters', () => {
    for (const only of [[], headings.slice(0, 1)]) {
      const html = renderToStaticMarkup(
        <ChapterBar headings={only} targetId="the-teaching" readMinutes={4} />
      )
      expect(html).not.toContain('<details')
      expect(html).not.toContain('Every chapter')
      expect(html).toContain('All articles')
    }
  })

  /* The strip sticks inside its parent's box and nowhere else. It spent
     its whole life inside a wrapper the height of itself, which bought it
     forty pixels of stickiness — so it has to stay a direct child of the
     element that spans the teaching, and it carries its own `xl:hidden`
     rather than borrowing a wrapper's. */
  it('is the thing that is hidden at xl, not a wrapper around it', () => {
    const html = renderToStaticMarkup(
      <ChapterBar headings={headings} targetId="the-teaching" readMinutes={4} />
    )
    expect(html.slice(0, 200)).toContain('sticky')
    expect(html.slice(0, 200)).toContain('xl:hidden')
  })

  it('offers the way back to the archive while the reader is in a teaching', () => {
    const html = renderToStaticMarkup(
      <ChapterBar headings={headings} targetId="the-teaching" readMinutes={4} />
    )
    expect(html).toContain('href="/"')
    expect(html).toContain('All articles')
  })

  /* The one thing the contents card it replaces got right. A chapter
     list is navigation, so it has to be in the markup for a crawler and
     work for a keyboard with no script running — which is why the
     disclosure is a `details` and not a piece of state. */
  it('is navigation before it is a script', () => {
    const html = renderToStaticMarkup(
      <ChapterBar headings={headings} targetId="the-teaching" readMinutes={11} />
    )
    expect(html).toContain('<details')
    expect(html).toContain('<summary')
    for (const heading of headings) expect(html).toContain(`#${heading.id}`)
  })

  /* Not "none". A strip that opened blank and filled itself in on the
     first scroll would read as something still loading. */
  it('opens on the first chapter before anybody has scrolled', () => {
    const html = renderToStaticMarkup(
      <ChapterBar headings={headings} targetId="the-teaching" readMinutes={11} />
    )
    expect(html).toContain('Does suffering mean that God is not good?')
    expect(html).toContain('sticky')
  })

  it('says nothing about minutes left before a reader has read any of it', () => {
    const html = renderToStaticMarkup(
      <ChapterBar headings={headings} targetId="the-teaching" readMinutes={11} />
    )
    expect(html).not.toContain('min left')
  })
})

const BODY = [
  'The opening sentence of the teaching, which takes the initial.',
  '',
  '## Does suffering mean that God is not good?',
  '',
  'A second paragraph, which does not.',
  '',
  '## Is asking why a failure of faith?',
  '',
  'A third.',
].join('\n')

/* A teaching that opens on a panel rather than on its own answer. The
   panel has already given the eye somewhere to start. */
const OPENS_ON_A_PANEL = [
  ':: note If you are afraid you have done it',
  ':: The fear itself is the evidence that you have not.',
  '',
  'The opening sentence of the teaching, which takes the initial.',
  '',
  '## Does suffering mean that God is not good?',
  '',
  'A second paragraph, which does not.',
].join('\n')

describe('the opening of a teaching', () => {
  /* Every headline here is a question and the first paragraph is the
     answer to it. Marking it off is the whole point: a reader who came
     from a search result gets the answer before deciding whether to read
     the teaching under it. */
  it('sets the answer off with a rule, and only the opening paragraph', () => {
    const html = renderToStaticMarkup(<ArticleProse body={BODY} />)
    expect(html.match(/opening-answer/g) ?? []).toHaveLength(1)
    expect(html.indexOf('opening-answer')).toBeLessThan(html.indexOf('A second paragraph'))
  })

  it('leaves the answer first in the document, where a snippet is read from', () => {
    const html = renderToStaticMarkup(<ArticleProse body={BODY} />)
    /* Ruled by a border on the paragraph, not wrapped in anything. */
    expect(html).toMatch(/<div class="chapter-run"><p class="opening-answer/)
  })

  /* The artwork earns its place in a listing, where it is what makes
     somebody choose the piece, and is a thing to scroll past once they
     have. Where a teaching opens on its answer the rule is what starts
     the eye; where it opens on something else, the initial still is. */
  it('keeps the illuminated initial where the teaching opens on a panel', () => {
    const html = renderToStaticMarkup(<ArticleProse body={OPENS_ON_A_PANEL} />)
    expect(html).not.toContain('opening-answer')
    expect(html.match(/dropcap/g) ?? []).toHaveLength(1)
  })

  /* Counted in CSS rather than passed in as a prop, because the count is
     a fact about the rendered document — so what the markup has to carry
     is the wrapper that resets the counter and the class that increments
     it. */
  it('numbers its chapters off the document rather than off an index', () => {
    const html = renderToStaticMarkup(<ArticleProse body={BODY} />)
    expect(html).toContain('chapter-run')
    expect(html.match(/chapter-head/g) ?? []).toHaveLength(2)
  })
})

describe('a link to a teaching that is not on the site', () => {
  /* Four live teachings linked, in their own text, to two that were never
     published — so a reader who followed the sentence got a 404, and a
     crawler counted each as a broken page. */
  const body = 'See [the difference](/articles/never-published) and [the live one](/articles/is-live).'
  const live = { 'is-live': { href: '/articles/is-live', title: 'Live', dek: '' } }

  it('keeps its words and loses the link, where the live set is known', () => {
    const html = renderToStaticMarkup(<ArticleProse body={body} links={live} />)
    expect(html).not.toContain('href="/articles/never-published"')
    expect(html).toContain('the difference')
    /* The link to a teaching that IS published is untouched. */
    expect(html).toContain('href="/articles/is-live"')
  })

  /* A desk preview passes no live set: a writer checking a draft has to
     see the link they typed, so nothing is dropped there. */
  it('renders every link as written when the live set is not given', () => {
    const html = renderToStaticMarkup(<ArticleProse body={body} />)
    expect(html).toContain('href="/articles/never-published"')
  })

  it('leaves links that are not to a teaching alone', () => {
    const html = renderToStaticMarkup(
      <ArticleProse body={'Find [an altar](/altars) or [the ministry](https://example.org).'} links={live} />
    )
    expect(html).toContain('href="/altars"')
    expect(html).toContain('href="https://example.org"')
  })
})
