import * as React from 'react'
import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = {
  title: 'Prophecies',
  description:
    'The prophetic record of the Ministry of Repentance and Holiness — every word weighed and tested. Opening soon.',
  alternates: { canonical: '/prophecies' },
}

export default function PropheciesPage() {
  return (
    <ComingSoon
      kicker="The desk"
      title="Prophecies"
      blurb="Reading the times with sobriety — every word weighed and tested."
      verse="Surely the Lord GOD will do nothing, but he revealeth his secret unto his servants the prophets."
      reference="Amos 3:7"
    />
  )
}
