import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

/**
 * The reader's navigation at the foot of a phone.
 *
 * The site's only way through itself on a phone was the menu button in
 * the masthead — a sheet to open, read and dismiss to go one place, put
 * at the furthest point on the screen from a thumb. Four destinations sit
 * where the hand already is instead.
 *
 * What these hold to is the part that is easy to get wrong and invisible
 * when it is: which tab claims a given page. A reader who opens a
 * teaching has not left the reading room, and a bar that went dark when
 * they did would be telling them they are nowhere.
 */

let path = '/'
vi.mock('next/navigation', () => ({ usePathname: () => path }))

let saved: string[] = []
vi.mock('@/lib/saved', () => ({
  useSaved: () => ({ saved, ready: true, toggle: () => {}, isSaved: () => false }),
}))

/* A plain import, not a dynamic one: vitest hoists the `vi.mock` calls
   above it, and neither factory reads `path` or `saved` until a render
   asks for them — by which time both are set. */
import { BottomNav } from '@/components/bottom-nav'

/** The tab marked as the page you are on, or none. */
function current(at: string): string | null {
  path = at
  const html = renderToStaticMarkup(<BottomNav />)
  /* The label of whichever link carries aria-current. */
  const match = html.match(/aria-current="page"[\s\S]*?leading-none">([^<]+)</)
  return match ? match[1] : null
}

describe('which tab claims a page', () => {
  it('gives each section its own', () => {
    expect(current('/')).toBe('Reading')
    expect(current('/prophecies')).toBe('Prophecy')
    expect(current('/teachings')).toBe('Teachings')
    expect(current('/saved')).toBe('Saved')
  })

  /* The reading room is a section, not a single page. A teaching, the
     archive, a subject listing and an author's page are all inside it. */
  it('keeps a reader in the reading room while they read', () => {
    expect(current('/articles/what-is-repentance-and-holiness')).toBe('Reading')
    expect(current('/topics/doctrine')).toBe('Reading')
    expect(current('/authors/simon-juma')).toBe('Reading')
  })

  it('marks a deeper page of a section as that section', () => {
    expect(current('/prophecies/colombia')).toBe('Prophecy')
    expect(current('/teachings/global-conference-bogota')).toBe('Teachings')
  })

  /* A page belonging to no tab is not a reason to light one up. */
  it('claims nothing on a page outside all four', () => {
    expect(current('/about')).toBeNull()
    expect(current('/altars')).toBeNull()
  })
})

describe('the count on Saved', () => {
  it('is absent when nothing is kept', () => {
    saved = []
    path = '/'
    /* The tab's own label is the word "Saved"; what must be absent is
       the count beside it and the sentence read out for it. */
    expect(renderToStaticMarkup(<BottomNav />)).not.toMatch(/\d+ saved/)
  })

  it('says how many, and reads it out for a screen reader', () => {
    saved = ['a', 'b', 'c', 'd']
    path = '/'
    const html = renderToStaticMarkup(<BottomNav />)
    expect(html).toContain('>4<')
    expect(html).toContain('4 saved')
  })

  /* A number wider than the badge would push the bar around. */
  it('stops counting at a width the badge can hold', () => {
    saved = Array.from({ length: 140 }, (_, n) => `piece-${n}`)
    path = '/'
    expect(renderToStaticMarkup(<BottomNav />)).toContain('99+')
  })
})
