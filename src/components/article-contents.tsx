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
 * And it opens closed. A twelve-chapter teaching put twelve rows between
 * the standfirst and the first sentence on a phone — the reader scrolled
 * through the whole table of contents to reach the writing. A `details`
 * element folds it to one line, still in the markup for a crawler and
 * still one tap from a reader who wants to jump. No script: the browser
 * has done this since before it needed one.
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
      <details className="group">
        <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3">
          <span id="in-this-teaching" className="kicker text-ink-subtle">
            On this page
            <span aria-hidden className="ml-1.5 tabular font-mono text-gold">
              {headings.length}
            </span>
          </span>
          {/* Turns a quarter when it opens; the only moving part. */}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
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
      </details>
    </nav>
  )
}
