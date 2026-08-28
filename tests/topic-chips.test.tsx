import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TopicChips } from '@/components/archive/topics-rail'
import type { Category } from '@/lib/content'

/**
 * The filter, at the widths where the rail that used to hold it is at the
 * foot of the page.
 *
 * The rail stacks last on a phone on purpose — furniture should not stand
 * between a reader and the teaching — and that left the archive with a
 * subject filter reachable only by scrolling past the whole archive,
 * which is to say not reachable at all. This is the one line that fixes
 * it without undoing the reason the rail is down there.
 *
 * Rendered to markup rather than driven in a browser: what can be checked
 * without one is that every subject is offered, that the counts are the
 * real ones, that the current subject is marked, and that the row is
 * hidden at the width where the rail draws its own list — which is the
 * whole contract, and the part that would silently rot.
 */

const counts: { category: Category; count: number }[] = [
  { category: 'Teachings' as Category, count: 9 },
  { category: 'Prophecy' as Category, count: 4 },
  { category: 'Doctrine' as Category, count: 2 },
]

const draw = (over: Partial<React.ComponentProps<typeof TopicChips>> = {}) =>
  renderToStaticMarkup(
    <TopicChips counts={counts} total={15} active={null} onPick={() => undefined} {...over} />
  )

describe('the topic chips', () => {
  it('offers every subject, and the whole archive before them', () => {
    const html = draw()
    expect(html).toContain('All')
    for (const { category } of counts) expect(html).toContain(category)
  })

  it('carries the real counts, not a total split evenly', () => {
    const html = draw()
    expect(html).toContain('>15<')
    expect(html).toContain('>9<')
    expect(html).toContain('>4<')
    expect(html).toContain('>2<')
  })

  it('marks the whole archive as current when nothing is filtered', () => {
    /* Two chips must never both be current, which is what an
       `active === category` test gets wrong when active is null. */
    const html = draw({ active: null })
    expect(html.match(/aria-current="true"/g)).toHaveLength(1)
  })

  it('marks the chosen subject, and only it', () => {
    const html = draw({ active: 'Prophecy' as Category })
    expect(html.match(/aria-current="true"/g)).toHaveLength(1)
    /* The mark is on Prophecy rather than on "All". */
    const at = html.indexOf('Prophecy')
    const mark = html.lastIndexOf('aria-current="true"', at)
    expect(html.slice(mark, at)).not.toContain('All')
  })

  it('is not drawn at the width where the rail lists the same subjects', () => {
    /* Both on the page at once would be one control with two appearances
       and two positions. The rail's own list is `hidden lg:block`; this
       is its opposite. */
    expect(draw()).toContain('lg:hidden')
  })

  it('names itself for a reader who cannot see that it is a filter', () => {
    expect(draw()).toContain('aria-label="Filter by topic"')
  })

  it('has a row for every subject and one more for the archive', () => {
    const buttons = draw().match(/<button/g) ?? []
    expect(buttons).toHaveLength(counts.length + 1)
  })

  it('draws nothing but the archive chip when the archive has no sections', () => {
    const html = renderToStaticMarkup(
      <TopicChips counts={[]} total={0} active={null} onPick={() => undefined} />
    )
    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toContain('>0<')
  })
})

describe('what a tap does', () => {
  /* renderToStaticMarkup drops handlers, so the behaviour is exercised on
     the element tree itself: the chip a reader taps is the one whose
     onClick decides what `topic` becomes, and the toggle-off rule is the
     easy thing to get backwards. */
  const chipsOf = (active: Category | null, onPick: (c: Category | null) => void) => {
    const tree = TopicChips({ counts, total: 15, active, onPick }) as any
    const nodes: any[] = []
    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) return node.forEach(walk)
      if (node.type === 'button') nodes.push(node)
      walk(node.props?.children)
    }
    walk(tree.props.children)
    return nodes
  }

  it('picks the subject that was tapped', () => {
    const onPick = vi.fn()
    const [, teachings] = chipsOf(null, onPick)
    teachings.props.onClick()
    expect(onPick).toHaveBeenCalledWith('Teachings')
  })

  it('clears the filter when the subject already showing is tapped again', () => {
    const onPick = vi.fn()
    const [, teachings] = chipsOf('Teachings' as Category, onPick)
    teachings.props.onClick()
    expect(onPick).toHaveBeenCalledWith(null)
  })

  it('returns the whole archive from the first chip', () => {
    const onPick = vi.fn()
    const [all] = chipsOf('Prophecy' as Category, onPick)
    all.props.onClick()
    expect(onPick).toHaveBeenCalledWith(null)
  })
})
