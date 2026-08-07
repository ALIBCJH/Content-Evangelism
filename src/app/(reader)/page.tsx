import * as React from 'react'
import type { Metadata } from 'next'
import { ArchiveView } from '@/components/archive/archive-view'

/* The archive is the site. The newest piece opens in place at the top and
   everything published sits beneath it, newest month first. */

export const metadata: Metadata = {
  title: {
    absolute: 'Repent and Prepare the Way — Articles',
  },
  description:
    'The full archive from the publication desk of the Ministry of Repentance and Holiness — every piece opens with its first line.',
  alternates: { canonical: '/' },
}

export const dynamic = 'force-dynamic'

export default function ArchivePage() {
  return (
    <ArchiveView
      kicker="Archive"
      title="Articles"
      purpose="Writing on repentance, holiness, and the garments of the priesthood. Every piece opens with its first line, so you can start reading here."
      emptyMessage="Nothing has been published yet. The first piece will open here."
    />
  )
}
