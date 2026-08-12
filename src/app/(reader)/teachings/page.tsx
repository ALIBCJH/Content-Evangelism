import * as React from 'react'
import type { Metadata } from 'next'
import { rssAlternate } from '@/lib/seo'
import { ComingSoon } from '@/components/coming-soon'

/* A placard is not a page. Until this section opens it carries noindex
   and stays out of the sitemap: three near-empty URLs crawled daily drag
   on how the whole site is assessed. Delete the robots line the day it
   opens — nothing else here needs to change. */
export const metadata: Metadata = {
  title: 'Teachings',
  description:
    'Expositions and sermons from the Ministry of Repentance and Holiness — the Scriptures opened for the church. Opening soon.',
  alternates: { canonical: '/teachings', types: rssAlternate },
  robots: { index: false, follow: true },
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
