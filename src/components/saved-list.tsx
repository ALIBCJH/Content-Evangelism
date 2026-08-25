'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import type { ArchiveItem } from '@/lib/archive-items'
import { PieceCard } from '@/components/archive/piece-card'
import { useSaved } from '@/lib/saved'

/**
 * The teachings a reader has put aside.
 *
 * Every piece on the site is handed in from the server and the browser
 * keeps the ones whose slugs it holds. That is the wrong way round for a
 * large archive and the right way round for this one: the saved list
 * lives in localStorage and nothing about it can be known on the server,
 * so the alternative is a round trip after the page has already
 * rendered, which shows every reader an empty page first.
 *
 * The order is the reader's, not the archive's. A saved list sorted by
 * publication date would rearrange itself around the reader every time
 * they added something old; kept in the order things were saved, the
 * piece they put aside last is where they left it. Newest first, because
 * the reason to open this page is usually the thing just saved.
 */
export function SavedList({ items }: { items: ArchiveItem[] }) {
  const { saved, ready, toggle } = useSaved()

  const kept = React.useMemo(() => {
    const bySlug = new Map(items.map((item) => [item.slug, item]))
    /* A slug with no piece behind it is one that has since been taken off
       the site. It is skipped rather than drawn as a broken row: the
       reader saved a teaching, and what is gone is the teaching. */
    return saved
      .map((slug) => bySlug.get(slug))
      .filter((item): item is ArchiveItem => Boolean(item))
      .reverse()
  }, [items, saved])

  /* Until the browser has read localStorage there is no honest answer.
     Saying "nothing saved" and then filling the page is worse than
     saying nothing for one frame. */
  if (!ready) {
    return <p className="mt-10 font-sans text-sm text-ink-subtle">Reading what you kept…</p>
  }

  if (kept.length === 0) {
    return (
      <div className="mt-10 rounded-panel border border-rule bg-card px-6 py-10 text-center">
        <Bookmark aria-hidden className="mx-auto h-7 w-7 text-ink-subtle" strokeWidth={1.5} />
        <p className="mt-4 font-article text-[1.25rem] leading-snug text-navy">
          Nothing kept yet
        </p>
        <p className="mx-auto mt-3 max-w-[26rem] text-[0.9375rem] leading-[1.7] text-ink-700">
          Tap <span className="font-semibold">Save</span> on any teaching and it waits here — and
          on this device, readable with no connection.
        </p>
        <p className="mt-6">
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-2 rounded-chip bg-cta px-5 py-2.5 text-[0.9375rem] font-semibold text-cta-ink transition-colors hover:bg-cta-hover"
          >
            Find something to read
          </Link>
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="mt-2 font-sans text-sm text-ink-muted">
        {kept.length === 1 ? 'One teaching' : `${kept.length} teachings`}, kept on this device.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {kept.map((item) => (
          <PieceCard
            key={item.slug}
            item={item}
            saved
            ready={ready}
            onToggle={() => toggle(item.slug)}
          />
        ))}
      </div>
    </>
  )
}
