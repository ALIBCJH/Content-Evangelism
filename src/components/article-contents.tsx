import * as React from 'react'
import type { Heading } from '@/lib/toc'

/**
 * The chapter list, set in flow above the body.
 *
 * The rail carries this from `lg` up. Below that there would otherwise be
 * no way to see the shape of a teaching before reading it, and no way to
 * jump within it. This is that, for every narrower width.
 *
 * It is plain server-rendered anchors on purpose. A chapter list is
 * navigation, so it has to work as navigation does: crawlable, openable
 * in a new tab, and reachable by keyboard without a script running.
 *
 * Set in the apparatus face, like the rail it stands in for — this is
 * scanned to find a place, not read through.
 */
export function ArticleContents({
  headings,
  className = '',
}: {
  headings: Heading[]
  className?: string
}) {
  /* One chapter is not a structure worth printing. */
  if (headings.length < 2) return null

  return (
    <nav aria-labelledby="in-this-teaching" className={`font-apparatus ${className}`}>
      <p id="in-this-teaching" className="kicker text-ink-subtle">
        On this page
      </p>
      <ol className="mt-3 border-t border-rule-soft">
        {headings.map((heading, index) => (
          <li key={heading.id} className="border-b border-rule-soft last:border-b-0">
            <a
              href={`#${heading.id}`}
              className="focus-ring group flex items-baseline gap-3.5 py-3 pr-2 transition-colors"
            >
              <span
                aria-hidden
                className="tabular font-mono text-[0.6875rem] text-gold"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-[0.9375rem] leading-snug text-ink-700 transition-colors group-hover:text-navy">
                {heading.text}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
