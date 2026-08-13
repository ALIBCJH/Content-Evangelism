import * as React from 'react'
import type { Metadata } from 'next'
import { rssAlternate } from '@/lib/seo'
import { ArchiveView } from '@/components/archive/archive-view'

/* Every piece the ministry has published, newest first. */

export const metadata: Metadata = {
  title: {
    absolute: 'Articles — Teachings, Prophecies & Oracles | Repent and Prepare the Way',
  },
  description:
    'Long-form writing from the Ministry of Repentance and Holiness. Scripture examined passage by passage, with the questions readers ask answered plainly.',
  alternates: { canonical: '/articles', types: rssAlternate },
}

export const revalidate = 300

export default function ArticlesPage() {
  return (
    <ArchiveView
      kicker="Articles"
      title="Articles"
      emptyMessage="Nothing has been published yet. The first piece will open here."
      collection={{
        name: 'The Archive',
        description:
          'Every teaching, prophecy, and oracle published by the Ministry of Repentance and Holiness.',
        path: '/articles',
      }}
    />
  )
}
