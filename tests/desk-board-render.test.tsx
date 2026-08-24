import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FindingsBand } from '@/components/admin/board/findings'
import { HealthBand, NeedsBand, PartsBand, StretchBand } from '@/components/admin/board/bands'
import { PiecesTable } from '@/components/admin/board/pieces-table'
import { pieceRows, summarise, type DeskArticle } from '@/lib/desk-overview'
import type { DayTotals, PageInsight } from '@/lib/insight-shape'

/**
 * That the bands actually draw.
 *
 * Everything else about this board is arithmetic, and arithmetic is
 * tested where it lives. What these catch is the other half: a component
 * that throws on an empty array, a share that divides by nothing, a
 * teaching with no sections opening a panel with no content. Rendered to
 * markup rather than to a browser, which needs no new dependency and
 * still runs every line of the components.
 */

const day = (n: number, views: number): DayTotals => ({
  day: `2026-08-${String(n).padStart(2, '0')}`,
  views,
  seconds: views * 90,
  finished: Math.floor(views / 3),
})

const article = (slug: string, over: Partial<DeskArticle> = {}): DeskArticle => ({
  slug,
  title: `On ${slug}`,
  category: 'Teachings',
  authorName: 'The Editorial Desk',
  publishedAt: '2026-08-01T00:00:00.000Z',
  readMinutes: 7,
  status: 'published',
  verified: false,
  ...over,
})

const page = (path: string, over: Partial<PageInsight> = {}): PageInsight => ({
  path,
  views: 0,
  seconds: 0,
  finished: 0,
  clicks: {},
  sections: {},
  ...over,
})

const ROWS = pieceRows(
  [article('suffering'), article('rapture'), article('waiting', { status: 'pending' })],
  [page('/articles/suffering', { views: 240, seconds: 60_000, finished: 190 })],
  [page('/articles/suffering', { views: 900, sections: { opening: 300, cost: 700 } })]
)

describe('the bands draw', () => {
  it('shows the four things needing a decision', () => {
    const html = renderToStaticMarkup(
      <NeedsBand needs={{ waiting: 2, unverified: 12, sentBack: 1, unanswered: 4 }} />
    )
    expect(html).toContain('Waiting for review')
    expect(html).toContain('Live but unverified')
    expect(html).toContain('12')
    /* The readers' queue is the one that is somewhere else. */
    expect(html).toContain('/admin/questions')
  })

  /* The promise the site makes to its readers, printed where the numbers
     are, not buried in a page nobody opens. */
  it('says visits rather than visitors, on the page itself', () => {
    const series = [day(23, 10), day(24, 14)]
    const html = renderToStaticMarkup(
      <StretchBand summary={summarise(series, [day(21, 8), day(22, 8)])} series={series} days={30} />
    )
    expect(html).toContain('Visits, not visitors')
    /* The only time the word appears is the sentence disowning it. Every
       figure on the band is labelled "Visits". */
    expect(html.match(/visitors/g)).toHaveLength(1)
    expect(html).toContain('>Visits<')
  })

  it('draws a line over the days without a charting library', () => {
    const series = [day(20, 0), day(21, 5), day(22, 30), day(23, 2), day(24, 0)]
    const html = renderToStaticMarkup(
      <StretchBand summary={summarise(series, [])} series={series} days={5} />
    )
    expect(html).toContain('<polyline')
    expect(html).toContain('aria-label="Visits over the last 5 days')
  })

  /* A stretch with nothing in it is the state a new deployment is in for
     its first day, and it must not divide by zero on the way to saying so. */
  it('survives a stretch in which nothing happened', () => {
    const html = renderToStaticMarkup(
      <StretchBand summary={summarise([], [])} series={[]} days={30} />
    )
    expect(html).toContain('The last 30 days')
    expect(html).not.toContain('NaN')
    expect(html).not.toContain('Infinity')
  })

  it('lists every piece, pending ones included', () => {
    const html = renderToStaticMarkup(<PiecesTable rows={ROWS} days={30} />)
    expect(html).toContain('On suffering')
    expect(html).toContain('On waiting')
    expect(html).toContain('Waiting')
    expect(html).toContain('Unverified')
  })

  /* A rate off no visits at all is not zero per cent, it is nothing
     known — and the table prints a dash rather than accusing a teaching
     nobody has opened of losing its readers. */
  it('refuses to print a finish rate it cannot stand behind', () => {
    const html = renderToStaticMarkup(<PiecesTable rows={ROWS} days={30} />)
    expect(html).toContain('79%')
    expect(html).toContain('Too few visits to judge')
  })

  it('draws both findings lists, and says so when they are empty', () => {
    const html = renderToStaticMarkup(<FindingsBand deadEnds={[]} unread={[]} />)
    expect(html).toContain('Opened, then left')
    expect(html).toContain('On the site, barely read')
    expect(html).toContain('Everything published is being found.')
  })

  it('draws the parts of the site with a bar apiece', () => {
    const html = renderToStaticMarkup(
      <PartsBand
        parts={[
          { part: 'Articles', views: 200, seconds: 80_000, share: 0.8 },
          { part: 'Altars', views: 50, seconds: 20_000, share: 0.2 },
        ]}
        clicks={[{ label: 'listen-article', count: 9 }]}
      />
    )
    expect(html).toContain('Articles')
    expect(html).toContain('width:80%')
    /* The stored label is not what a person at the desk should read. */
    expect(html).toContain('Listened instead of reading')
    expect(html).not.toContain('listen-article')
  })

  it('has something to say when nothing has been counted', () => {
    const html = renderToStaticMarkup(<PartsBand parts={[]} clicks={[]} />)
    expect(html).toContain('Nothing counted in this stretch yet.')
  })

  it('marks each health note as what it is, for a reader who cannot see colour', () => {
    const html = renderToStaticMarkup(
      <HealthBand
        notes={[
          { level: 'bad', note: 'No article store attached.' },
          { level: 'good', note: 'Readers are being counted.' },
        ]}
      />
    )
    expect(html).toContain('Problem: ')
    expect(html).toContain('Good: ')
  })
})
