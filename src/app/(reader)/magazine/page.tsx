import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { siteInfo } from '@/lib/content'

/**
 * The magazine, before there is a magazine.
 *
 * The section was asked for in the navigation while it is still being
 * designed, which leaves a page that has to do one job honestly: say what
 * this will be, say that it is not here yet, and hand the reader back
 * something that is. A section in the navigation that opens on nothing at
 * all is worse than no section — a reader who taps it once and finds a
 * blank will not tap it again when there is something behind it.
 *
 * `noindex` while it is empty, and it is not in the sitemap. A search
 * engine that files an empty page files it as thin, and the page it
 * remembers is the one it saw first. `follow`, though: the links out of
 * here are the archive and they are worth crawling.
 *
 * The heading is set at the archive's own scale rather than smaller,
 * because this is a section of the publication and not an apology for
 * one. See the prophetic-timeline rail, which was held open the same way
 * and for the same reason.
 *
 * When the first issue exists this file becomes the listing and the
 * `robots` line comes out — and the sitemap entry goes in.
 */

export const metadata: Metadata = {
  title: 'Magazine',
  description: `The magazine of the ${siteInfo.ministry} — in preparation.`,
  alternates: { canonical: '/magazine' },
  robots: { index: false, follow: true },
}

export default function MagazinePage() {
  return (
    <main>
      <section className="border-b border-rule bg-raised">
        <div className="shell py-10 sm:py-12">
          <p className="kicker text-gold">In preparation</p>
          <h1 className="mt-2.5 font-display text-[1.75rem] font-medium leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.375rem]">
            The Magazine
          </h1>
          <p className="mt-3 max-w-[62ch] text-[1.0625rem] leading-[1.7] text-ink-700">
            The magazine of the {siteInfo.ministry} is being made. It is not
            here yet, and this page will hold it when it is.
          </p>
        </div>
      </section>

      <div className="shell pb-24 pt-14">
        <div className="max-w-[62ch]">
          <p className="text-[0.9375rem] leading-[1.75] text-ink-700">
            Nothing has been withheld from this page — there is simply nothing
            on it yet. The section stands in the navigation so that it is
            where it will always be, rather than appearing one day in a place
            nobody has learned.
          </p>

          <p className="mt-5 text-[0.9375rem] leading-[1.75] text-ink-700">
            Everything the ministry has published so far is in the archive,
            and it is all free to read.
          </p>

          <p className="mt-8 border-t border-rule pt-8">
            <Link
              href="/"
              className="focus-ring kicker text-navy transition-colors hover:text-gold"
            >
              Read the archive →
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
