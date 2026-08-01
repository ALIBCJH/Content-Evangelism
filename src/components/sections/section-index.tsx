import * as React from 'react'
import Link from 'next/link'
import { CATEGORIES, categoryMeta } from '@/lib/content'

/**
 * A slim newspaper-style section index directly under the fold — one tap
 * from the front page into any desk, so readers never have to guess where
 * the teachings, prophecies, or oracles live.
 */
export function SectionIndex() {
  return (
    <nav aria-label="Browse by section" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* border-t only — the strip below brings its own top rule, so a
          border-y here would read as a double hairline. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 border-t border-hairline py-4">
        <span className="kicker mr-3 text-ink-subtle">Browse the desk</span>
        {CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/category/${categoryMeta[category].slug}`}
            className="focus-ring inline-flex h-10 items-center rounded-full border border-hairline-strong px-4 sm:h-8 sm:px-3.5 font-sans text-xs font-semibold text-ink-muted transition-colors hover:border-gold/60 hover:bg-gold/10 hover:text-gold"
          >
            {category}
          </Link>
        ))}
      </div>
    </nav>
  )
}
