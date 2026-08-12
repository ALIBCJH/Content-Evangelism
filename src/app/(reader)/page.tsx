import * as React from 'react'
import type { Metadata } from 'next'
import { rssAlternate } from '@/lib/seo'
import { ArchiveView } from '@/components/archive/archive-view'

/* The archive is the site. The newest piece opens in place at the top and
   everything published sits beneath it, newest month first. */

export const metadata: Metadata = {
  title: {
    absolute: 'Teachings, Prophecies & Oracles — Repent and Prepare the Way',
  },
  description:
    'The full archive from the publication desk of the Ministry of Repentance and Holiness — teachings, prophecies, oracles, and devotionals. Every piece opens with its first line.',
  alternates: { canonical: '/', types: rssAlternate },
}

/* Statically served and rebuilt every five minutes; the posting desk also
   revalidates this path on publish, so a new piece appears at once. Under
   force-dynamic every crawl and every reader paid for a cold render. */
export const revalidate = 300

export default function ArchivePage() {
  return (
    <ArchiveView
      kicker="Archive"
      title="Teachings, Prophecies & Oracles"
      purpose="Writing on repentance, holiness, and the garments of the priesthood. Every piece opens with its first line, so you can start reading here."
      emptyMessage="Nothing has been published yet. The first piece will open here."
      collection={{
        name: 'The Archive',
        description:
          'Every teaching, prophecy, and oracle published by the Ministry of Repentance and Holiness.',
        path: '/',
      }}
    />
  )
}
