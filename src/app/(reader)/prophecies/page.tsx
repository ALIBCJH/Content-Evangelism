import * as React from 'react'
import type { Metadata } from 'next'
import { ArchiveView } from '@/components/archive/archive-view'

export const metadata: Metadata = {
  title: 'Prophecies',
  description:
    'The prophetic record of the Ministry of Repentance and Holiness — every word weighed and tested.',
  alternates: { canonical: '/prophecies' },
}

export const dynamic = 'force-dynamic'

/* The section is titled "Prophecies"; the category on an article is the
   singular "Prophecy", which is what the store records. */
export default function PropheciesPage() {
  return (
    <ArchiveView
      kicker="The desk"
      title="Prophecies"
      purpose="Reading the times with sobriety — every word weighed and tested."
      category="Prophecy"
      emptyMessage="Nothing has been published in Prophecy yet. The first piece will open here."
    />
  )
}
