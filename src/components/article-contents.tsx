import * as React from 'react'
import type { Heading } from '@/lib/toc'

/**
 * The chapter list, set in flow above the body.
 *
 * The study margin carries this on a wide screen, but the margin is a
 * desktop rail — below `xl` there was previously no way to see the shape
 * of a teaching before reading it, and no way to jump within it. This is
 * that, for every other width.
 *
 * It is plain server-rendered anchors on purpose. A chapter list is
 * navigation, so it has to work as navigation does: crawlable, openable
 * in a new tab, and reachable by keyboard without a script running.
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
    <nav aria-labelledby="in-this-teaching" className={className}>
      <p id="in-this-teaching" className="kicker text-gold">
        In this teaching
      </p>
      <ol className="mt-4 border-t border-hairline">
        {headings.map((heading, index) => (
          <li key={heading.id} className="border-b border-hairline">
            <a
              href={`#${heading.id}`}
              className="focus-ring group flex items-baseline gap-3.5 py-3 pr-2 transition-colors hover:text-ink-strong"
            >
              <span
                aria-hidden
                className="tabular font-sans text-[0.6875rem] font-medium tracking-[0.08em] text-gold"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-[1.0625rem] font-normal leading-snug text-ink-muted transition-colors group-hover:text-ink-strong">
                {heading.text}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
