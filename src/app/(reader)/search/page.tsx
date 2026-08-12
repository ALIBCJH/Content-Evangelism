import * as React from 'react'
import type { Metadata } from 'next'
import { Search } from 'lucide-react'
import { listRealRows } from '@/lib/rows'
import { ArticleCard } from '@/components/article-card'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { q?: string }
}

/* Internal search is a reader's tool, not a landing page: the shell has
   no content of its own and the result pages are thin, query-shaped
   duplicates of the articles they list. Both carry noindex — and it is
   noindex rather than a robots.txt disallow, because a URL that cannot be
   crawled cannot be read to discover it should not be indexed. Crawling
   stays open so the links out of here still pass through. */
export const metadata: Metadata = {
  title: 'Search',
  description: 'Search the archive of Repent and Prepare the Way.',
  alternates: { canonical: '/search' },
  robots: { index: false, follow: true },
}

export default async function SearchPage({ searchParams }: Props) {
  const query = (searchParams.q ?? '').trim()
  const rows = query
    ? (await listRealRows()).filter((row) => row.text.includes(query.toLowerCase()))
    : []

  return (
    <>
      <main className="mx-auto max-w-5xl px-5 pb-20 pt-4 sm:px-6 md:pb-28">
        <div className="mx-auto max-w-xl text-center">
          <p className="kicker text-gold">The archive</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink-strong md:text-4xl">
            Search
          </h1>
          <form action="/search" method="GET" role="search" className="relative mt-8">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search teachings, prophecies, articles…"
              enterKeyHint="search"
              className="focus-ring h-12 w-full rounded-full border border-hairline-strong bg-surface pl-12 pr-5 font-sans text-base text-ink placeholder:text-ink-subtle transition-colors focus:border-gold/60 sm:text-sm"
            />
          </form>
        </div>

        {query && (
          <div className="mt-12">
            <p className="border-b border-hairline-strong pb-3 font-sans text-xs uppercase tracking-kicker text-ink-subtle">
              {rows.length === 0
                ? `Nothing found for “${query}”`
                : `${rows.length} ${rows.length === 1 ? 'result' : 'results'} for “${query}”`}
            </p>
            {rows.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((row) => (
                  <ArticleCard key={row.slug} row={row} />
                ))}
              </div>
            ) : (
              <p className="mx-auto mt-12 max-w-md text-center font-serif text-base leading-relaxed text-ink-muted">
                Try a different word — or browse the full reading room from the
                Articles page.
              </p>
            )}
          </div>
        )}
      </main>
    </>
  )
}
