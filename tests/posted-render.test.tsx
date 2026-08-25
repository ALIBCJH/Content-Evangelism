import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Posted } from '@/components/posted'

/**
 * What the server sends for a posting time.
 *
 * The rule — recency for the first day, a date after — cannot be decided
 * on the server. These pages are generated and then served from a cache
 * for the length of the revalidation window, so "moments ago" would be
 * baked into HTML still being handed out hours later; and the server's
 * answer and the browser's first render would differ, which is a
 * hydration mismatch.
 *
 * So the invariant is narrow and worth pinning: whatever the server
 * renders is the date, however new the piece. The relative form is only
 * ever reached from an effect, which runs in a browser where the clock is
 * the reader's own.
 */

const markup = (element: React.ReactElement) => renderToStaticMarkup(element)

describe('a posting time on a server-rendered page', () => {
  it('is the date even for a piece posted moments ago', () => {
    const html = markup(<Posted iso={new Date().toISOString()} />)
    expect(html).not.toMatch(/ago/)
    expect(html).toMatch(/\d{1,2} \w+ \d{4}/)
  })

  it('carries the full timestamp for machines, whatever it shows a person', () => {
    const iso = '2026-08-25T08:00:49.841Z'
    /* Case-insensitively: React writes `dateTime` into static markup and
       HTML attribute names are not case-sensitive. */
    expect(markup(<Posted iso={iso} />)).toMatch(new RegExp(`datetime="${iso}"`, 'i'))
  })

  /* Each surface already wrote a date its own way — "24 Aug 2026" in a
     dense list, "AUG 12, 2026" in the archive — and there is no reason to
     flatten them into one. The component owns which of the two forms to
     show, not what the date looks like. */
  it('keeps the house form the surface asked for', () => {
    const iso = '2026-03-14T08:00:00.000Z'
    expect(markup(<Posted iso={iso} dated="MAR 14, 2026" />)).toContain('MAR 14, 2026')
    expect(markup(<Posted iso={iso} />)).toContain('14 March 2026')
  })
})
