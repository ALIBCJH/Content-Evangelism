import * as React from 'react'
import { AskBot } from '@/components/ask-bot'
import { OfflineReady } from '@/components/offline-ready'
import { PastoralCare } from '@/components/pastoral-care'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { Tracker } from '@/components/insight/tracker'

/**
 * Shared chrome for every reader-facing page; /admin stays outside.
 *
 * The search index is no longer built here. It was, and it was handed to
 * the masthead as a prop — which put the full text of every teaching into
 * the RSC payload of every page on the site, 130KB of the front page's
 * 283KB, for a control most readers never opened. The overlay fetches it
 * on its first open instead; see `app/api/search-index/route.ts`.
 */
export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      {/* Every reader page ends the same way: the way to reach a person,
          and then the footer. Placed here rather than page by page so that
          no page a reader might be on when they decide to ask for help can
          be the one that forgot it. */}
      <PastoralCare />
      <SiteFooter />
      {/* Carried on every reader page: a question does not wait for the
          foot of the piece to arrive. */}
      <AskBot />
      {/* Saved pieces, and what has been read, kept for a journey with no
          signal — see public/sw.js. */}
      <OfflineReady />
      <Tracker />
    </div>
  )
}
