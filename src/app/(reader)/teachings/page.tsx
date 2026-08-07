import * as React from 'react'
import type { Metadata } from 'next'
import { ArchiveView } from '@/components/archive/archive-view'

export const metadata: Metadata = {
  title: 'Teachings',
  description:
    'Expositions and sermons from the Ministry of Repentance and Holiness — the Scriptures opened for the church.',
  alternates: { canonical: '/teachings' },
}

export const dynamic = 'force-dynamic'

export default function TeachingsPage() {
  return (
    <ArchiveView
      kicker="The desk"
      title="Teachings"
      purpose="Expositions and sermons — the Scriptures opened for the church."
      category="Teachings"
      emptyMessage="Nothing has been published in Teachings yet. The first piece will open here."
    />
  )
}
