import * as React from 'react'
import { buildSearchIndex } from '@/lib/search-index'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
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
    <div className="flex min-h-screen flex-col">
      <SiteHeader docs={docs} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <Tracker />
    </div>
  )
}
