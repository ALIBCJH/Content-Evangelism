import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

/**
 * The 404.
 *
 * A dead URL is still a visit. The default Next page is an unstyled dead
 * end with nothing to click, so every reader who mistypes a link — and
 * every crawler that follows a stale one — is simply dropped. This keeps
 * the masthead and the footer, and offers the way back in.
 *
 * The response still carries a 404 status, which is what tells Google to
 * drop the URL rather than keep it in the index as a soft 404.
 */

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

const ways = [
  { href: '/articles', label: 'The archive', hint: 'Everything published, newest first' },
  { href: '/prophecies', label: 'Prophecy Archive', hint: 'Every record with its source' },
  { href: '/search', label: 'Search', hint: 'Look for a teaching by name' },
  { href: '/about', label: 'The ministry', hint: 'Who publishes here' },
]

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="shell flex flex-1 flex-col justify-center py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="kicker text-gold">404</p>
          <h1 className="mt-3 font-display text-[2.25rem] font-medium leading-[1.06] tracking-[-0.02em] text-navy sm:text-[3rem]">
            This page is not here
          </h1>
          <p className="mt-6 text-[1.0625rem] leading-[1.75] text-ink-700">
            The link may have been retired, or the address mistyped. The
            reading room is still open.
          </p>
          <blockquote className="mt-8 border-t border-rule pt-8 font-display text-[1.25rem] leading-relaxed text-ink-muted">
            Ask for the old paths, where is the good way, and walk therein.
            <cite className="mt-3 block font-mono text-[0.6875rem] uppercase not-italic tracking-[0.08em] text-ink-subtle">
              Jeremiah 6:16
            </cite>
          </blockquote>
        </div>

        <ul className="mx-auto mt-12 w-full max-w-md divide-y divide-rule border-y border-rule">
          {ways.map((way) => (
            <li key={way.href}>
              <Link
                href={way.href}
                className="group flex items-baseline justify-between gap-4 py-4 transition-colors"
              >
                <span className="font-display text-[1.25rem] text-navy transition-colors group-hover:text-gold">
                  {way.label}
                </span>
                <span className="text-xs text-ink-subtle">{way.hint}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <Link
            href="/articles"
            className="group inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-muted transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            All articles
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-muted transition-colors hover:text-gold"
          >
            <Search className="h-3.5 w-3.5" />
            Search the archive
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
