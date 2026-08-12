import * as React from 'react'
import type { Metadata } from 'next'
import { rssAlternate } from '@/lib/seo'
import { ComingSoon } from '@/components/coming-soon'

/* A placard is not a page. Until this section opens it carries noindex
   and stays out of the sitemap: three near-empty URLs crawled daily drag
   on how the whole site is assessed. Delete the robots line the day it
   opens — nothing else here needs to change. */
export const metadata: Metadata = {
  title: 'Prophecies',
  description:
    'The prophetic record of the Ministry of Repentance and Holiness — every word weighed and tested. Opening soon.',
  alternates: { canonical: '/prophecies', types: rssAlternate },
  robots: { index: false, follow: true },
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
