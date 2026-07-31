import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { RealRow } from '@/lib/rows'
import { ago, CardImage } from '@/components/article-card'

/** "Read next" block at the foot of an article — image-led, like the feed. */
export function ReadNext({ rows }: { rows: RealRow[] }) {
  if (rows.length === 0) return null
  return (
    <div className="mt-12 border-t border-hairline pt-8">
      <p className="kicker text-gold">Read next</p>
      <ul className="mt-4 divide-y divide-hairline">
        {rows.map((row) => (
          <li key={row.slug}>
            <Link href={row.href} className="group flex items-center gap-4 py-4">
              <CardImage
                row={row}
                className="aspect-[16/11] w-24 shrink-0 rounded-lg border border-hairline"
                sealClassName="h-8 w-8"
                iconClassName="h-3.5 w-3.5"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-ink-strong">
                  {row.title}
                </span>
                <span className="mt-1 block font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
                  {row.category}
                  <span aria-hidden className="mx-1.5 text-gold">·</span>
                  {ago(row.publishedAt)}
                </span>
              </span>
              <ArrowRight
                aria-hidden
                className="h-4 w-4 shrink-0 text-ink-subtle transition-all group-hover:translate-x-1 group-hover:text-gold"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
