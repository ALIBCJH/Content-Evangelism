import * as React from 'react'
import Link from 'next/link'

/**
 * The rail beside a record — a prophecy or a recorded teaching.
 *
 * Three blocks, in the order a reader wants them: the other records of the
 * same kind, so leaving one record means arriving at another rather than
 * at nothing; the way back into the rest of the site; and the page's own
 * headings, for the widths where the rail is the only navigation.
 *
 * The first block is optional — a page that gives the rail other work to
 * do, as the prophecy record does with its title, omits it and keeps the
 * two blocks that remain.
 *
 * Both record pages use it, so the two kinds of record are read the same
 * way — which is the point of holding them in one site.
 */

export interface AsideItem {
  href: string
  date: string
  title: string
}

export function RecordAside({
  heading,
  items = [],
  links,
  contents,
  className = '',
}: {
  /** "More prophecies", "More teachings". Omit with `items`. */
  heading?: string
  items?: AsideItem[]
  links: { href: string; label: string }[]
  /** [label, element id] for this page's own sections. */
  contents: [string, string][]
  /** Where the rail sits in its page's grid. */
  className?: string
}) {
  return (
    <aside className={`flex flex-col gap-9 self-start lg:sticky lg:top-stick ${className}`}>
      {items.length > 0 && (
        <nav aria-label={heading}>
          <p className="kicker mb-1.5 border-b border-rule pb-3 text-ink-subtle">{heading}</p>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group block border-b border-dotted border-rule py-3.5"
            >
              <span className="mb-1 block font-mono text-[0.625rem] tracking-[0.06em] text-gold">
                {item.date}
              </span>
              <span className="block font-display text-[1.0625rem] leading-tight text-navy transition-colors group-hover:text-gold">
                {item.title}
              </span>
            </Link>
          ))}
        </nav>
      )}

      <nav aria-label="More links">
        <p className="kicker mb-1.5 border-b border-rule pb-3 text-ink-subtle">More links</p>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block border-b border-dotted border-rule py-3 font-mono text-[0.6875rem] tracking-[0.06em] text-navy transition-colors hover:text-gold"
          >
            {link.label} →
          </Link>
        ))}
      </nav>

      {contents.length > 0 && (
        <nav aria-label="On this page">
          <p className="kicker mb-1 border-b border-rule pb-3 text-ink-subtle">On this page</p>
          {contents.map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              className="block py-2 text-sm text-ink-700 transition-colors hover:text-gold"
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </aside>
  )
}
