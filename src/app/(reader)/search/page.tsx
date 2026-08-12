import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Search as SearchIcon } from 'lucide-react'
import { facetCounts, searchDocs } from '@/lib/search-docs'
import { buildSearchIndex } from '@/lib/search-index'
import { Breadcrumbs } from '@/components/breadcrumbs'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { q?: string; kind?: string }
}

/* Internal search is a reader's tool, not a landing page: the shell has no
   content of its own and the result pages are thin, query-shaped duplicates
   of the pages they list. Both carry noindex — and noindex rather than a
   robots.txt disallow, because a URL that cannot be crawled cannot be read
   to discover that it should not be indexed. Crawling stays open so the
   links out of here still pass through. */
export const metadata: Metadata = {
  title: 'Search',
  description: 'Search the archive of the Ministry of Repentance and Holiness.',
  alternates: { canonical: '/search' },
  robots: { index: false, follow: true },
}

export default async function SearchPage({ searchParams }: Props) {
  const query = (searchParams.q ?? '').trim()
  const kind = (searchParams.kind ?? '').trim()

  const docs = await buildSearchIndex()
  const matched = query ? searchDocs(docs, query) : []
  const facets = facetCounts(matched)
  const results = kind ? matched.filter((doc) => doc.kind === kind) : matched

  const link = (params: { q?: string; kind?: string }) => {
    const search = new URLSearchParams()
    if (params.q) search.set('q', params.q)
    if (params.kind) search.set('kind', params.kind)
    const value = search.toString()
    return value ? `/search?${value}` : '/search'
  }

  return (
    <main className="shell pb-24 pt-12">
      <Breadcrumbs className="mb-7" crumbs={[{ name: 'Home', href: '/' }, { name: 'Search' }]} />

      <h1 className="mb-7 font-display text-[2rem] font-medium leading-[1.1] text-navy sm:text-[2.875rem]">
        Search results
      </h1>

      <form
        action="/search"
        method="GET"
        role="search"
        className="mb-8 flex items-center gap-3 rounded-figure border border-rule bg-card px-5 py-4"
      >
        <SearchIcon aria-hidden className="h-[18px] w-[18px] shrink-0 text-ink-subtle" strokeWidth={1.75} />
        <input
          type="search"
          name="q"
          defaultValue={query}
          enterKeyHint="search"
          aria-label="Search the archive"
          placeholder="Search teachings, Scriptures, prophecies, sermons…"
          className="min-w-0 flex-1 border-0 bg-transparent text-[1.0625rem] text-ink outline-none"
        />
        <span className="hidden font-mono text-[0.6875rem] text-ink-subtle sm:inline">
          {query ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : ''}
        </span>
      </form>

      {!query ? (
        <p className="max-w-measure text-[1.0625rem] leading-[1.75] text-ink-muted">
          Search the whole archive — the writing, and the prophetic record. Try a
          book of the Bible, a nation, or a subject such as repentance or holiness.
        </p>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
          <nav aria-label="Content type" className="self-start lg:sticky lg:top-stick">
            <p className="kicker mb-3 text-ink-subtle">Content type</p>
            <Link
              href={link({ q: query })}
              aria-current={kind ? undefined : 'true'}
              className={`flex justify-between gap-3 border-b border-rule-soft py-2.5 text-sm transition-colors hover:text-gold ${
                kind ? 'text-ink-700' : 'text-gold'
              }`}
            >
              <span>All</span>
              <span className="font-mono text-[0.6875rem] text-ink-subtle">{matched.length}</span>
            </Link>
            {facets.map((facet) => (
              <Link
                key={facet.label}
                href={link({ q: query, kind: facet.label })}
                aria-current={kind === facet.label ? 'true' : undefined}
                className={`flex justify-between gap-3 border-b border-rule-soft py-2.5 text-sm transition-colors hover:text-gold ${
                  kind === facet.label ? 'text-gold' : 'text-ink-700'
                }`}
              >
                <span>{facet.label}</span>
                <span className="font-mono text-[0.6875rem] text-ink-subtle">{facet.count}</span>
              </Link>
            ))}
          </nav>

          <div>
            {results.length === 0 ? (
              <p className="max-w-measure text-[1.0625rem] leading-[1.75] text-ink-muted">
                Nothing found for &ldquo;{query}&rdquo;. Try a different word — or read the
                whole{' '}
                <Link href="/articles" className="border-b border-gold/50 text-navy hover:text-gold">
                  archive
                </Link>
                .
              </p>
            ) : (
              results.map((doc) => (
                <Link
                  key={doc.href}
                  href={doc.href}
                  className="block border-b border-rule py-6 transition-colors last:border-b-0 hover:bg-raised"
                >
                  <span className="mb-2.5 flex flex-wrap items-center gap-2.5">
                    <span className="kicker rounded-chip bg-chip-blue px-2.5 py-1 text-navy">
                      {doc.kind}
                    </span>
                    <span className="font-mono text-[0.6875rem] text-ink-subtle">{doc.date}</span>
                    <span className="font-mono text-[0.6875rem] text-gold">{doc.ref}</span>
                  </span>
                  <span className="mb-2 block font-display text-[1.375rem] font-medium leading-tight text-navy sm:text-[1.625rem]">
                    <span className="headline-link">{doc.title}</span>
                  </span>
                  <span className="block max-w-[720px] text-[0.9375rem] leading-[1.65] text-ink-muted">
                    {doc.excerpt}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  )
}
