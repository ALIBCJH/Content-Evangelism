import * as React from 'react'
import { buildSearchIndex } from '@/lib/search-index'
import { AskBot } from '@/components/ask-bot'
import { OfflineReady } from '@/components/offline-ready'
import { PastoralCare } from '@/components/pastoral-care'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { Tracker } from '@/components/insight/tracker'

/**
 * Shared chrome for every reader-facing page; /admin stays outside.
 *
 * The search index is built here, once per render of the shell, and handed
 * to the masthead — so the overlay answers a keystroke without a request
 * and every page carries the same index.
 */
export default async function ReaderLayout({ children }: { children: React.ReactNode }) {
  const docs = await buildSearchIndex()
  return (
    <div className="has-bottom-nav flex min-h-screen flex-col">
      <SiteHeader docs={docs} />
      <div className="flex-1">{children}</div>
      {/* Every reader page ends the same way: the way to reach a person,
          and then the footer. Placed here rather than page by page so that
          no page a reader might be on when they decide to ask for help can
          be the one that forgot it. */}
      <PastoralCare />
      <SiteFooter />
      {/* The reader's own navigation, at the foot of a phone. It is fixed
          over the document, so `has-bottom-nav` on the shell is what
          keeps it from covering the end of the footer. */}
      <BottomNav />
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
