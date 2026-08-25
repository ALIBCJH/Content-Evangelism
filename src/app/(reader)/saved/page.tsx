import type { Metadata } from 'next'
import { listRealRows } from '@/lib/rows'
import { toArchiveItems } from '@/lib/archive-items'
import { SavedList } from '@/components/saved-list'
import { Breadcrumbs } from '@/components/breadcrumbs'

/**
 * What a reader kept.
 *
 * A teaching could be saved from anywhere on the site and then not be
 * found again: saving wrote a slug to this browser and no page ever read
 * the list back. The bookmark was a gesture with nothing behind it. This
 * is the page it was always implying.
 *
 * Not indexed, and it should not be: what it renders is a list held in
 * one reader's browser, so a crawler is shown an empty page and every
 * reader is shown a different one. There is no account behind any of it
 * — see `src/lib/saved.ts` — which is the point.
 */
export const metadata: Metadata = {
  title: 'Saved',
  description: 'The teachings you have kept on this device.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/saved' },
}

export default async function SavedPage() {
  /* Every published piece, handed to the browser to pick its own out of.
     See SavedList for why the filtering happens there and not here. */
  const items = toArchiveItems(await listRealRows())

  return (
    <main className="shell max-w-[64rem] pb-24 pt-8">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Saved' }]} />
      <h1 className="mt-4 font-article text-[2rem] font-normal leading-[1.15] text-navy sm:text-[2.5rem]">
        Saved
      </h1>
      <SavedList items={items} />
    </main>
  )
}
