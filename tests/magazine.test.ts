import { describe, expect, it } from 'vitest'
import { navSections } from '@/lib/content'

/**
 * The magazine, held open in the navigation while it is being designed.
 *
 * The thing worth holding is not how the page looks — it is that a
 * section which exists in one navigation and not the other is a section
 * most readers cannot reach. The rail down the left is `xl` only; the bar
 * and the phone's sheet read `navSections`. A magazine added to the rail
 * alone would be invisible on every phone, which is most of this
 * ministry's readers.
 */

describe('the magazine section', () => {
  it('is in the list the bar and the phone sheet read', () => {
    const magazine = navSections.find((section) => section.href === '/magazine')
    expect(magazine).toBeDefined()
    expect(magazine!.label).toBe('Magazine')
  })

  it('comes straight after the archive', () => {
    const order = navSections.map((section) => section.href)
    expect(order.indexOf('/magazine')).toBe(order.indexOf('/') + 1)
  })

  /* Neither navigation draws `items`, and inventing headings for a
     magazine nobody has written would be putting words in the ministry's
     mouth. */
  it('claims no contents it does not have', () => {
    const magazine = navSections.find((section) => section.href === '/magazine')!
    expect(magazine.items).toEqual([])
  })
})
