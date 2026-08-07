import * as React from 'react'
import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = {
  title: 'Teachings',
  description:
    'Expositions and sermons from the Ministry of Repentance and Holiness — the Scriptures opened for the church. Opening soon.',
  alternates: { canonical: '/teachings' },
}

export default function TeachingsPage() {
  return (
    <ComingSoon
      kicker="The desk"
      title="Teachings"
      blurb="Expositions and sermons — the Scriptures opened for the church."
      verse="Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine."
      reference="2 Timothy 4:2"
    />
  )
}
