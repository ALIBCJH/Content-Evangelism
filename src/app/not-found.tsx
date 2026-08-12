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
  { href: '/', label: 'The archive', hint: 'Everything published, newest first' },
  { href: '/search', label: 'Search', hint: 'Look for a teaching by name' },
  { href: '/about', label: 'The ministry', hint: 'Who publishes here' },
]

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="shell flex min-h-[60vh] flex-col justify-center py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="kicker text-gold">404</p>
          <h1 className="mt-3 font-display text-[2.4rem] font-light leading-[1.06] tracking-[-0.02em] text-ink-strong sm:text-[3rem]">
            This page is not here
          </h1>
          <p className="mt-6 font-serif text-lg leading-relaxed text-ink-muted">
            The link may have been retired, or the address mistyped. The
            reading room is still open.
          </p>
          <blockquote className="mt-8 border-t border-thread pt-8 font-display text-lg font-light italic leading-relaxed text-ink-muted">
            Ask for the old paths, where is the good way, and walk therein.
            <cite className="mt-3 block font-sans text-xs uppercase not-italic tracking-kicker text-ink-subtle">
              Jeremiah 6:16
            </cite>
          </blockquote>
        </div>

        <ul className="mx-auto mt-12 w-full max-w-md divide-y divide-thread border-y border-thread">
          {ways.map((way) => (
            <li key={way.href}>
              <Link
                href={way.href}
                className="group flex items-baseline justify-between gap-4 py-4 transition-colors"
              >
                <span className="font-display text-lg text-ink-strong transition-colors group-hover:text-gold">
                  {way.label}
                </span>
                <span className="font-sans text-xs text-ink-subtle">{way.hint}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            All articles
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
          >
            <Search className="h-3.5 w-3.5" />
            Search the archive
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
