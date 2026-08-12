import * as React from 'react'
import type { Metadata } from 'next'
import { rssAlternate } from '@/lib/seo'
import { ComingSoon } from '@/components/coming-soon'

/* A placard is not a page. Until this section opens it carries noindex
   and stays out of the sitemap: three near-empty URLs crawled daily drag
   on how the whole site is assessed. Delete the robots line the day it
   opens — nothing else here needs to change. */
export const metadata: Metadata = {
  title: 'About',
  description:
    'About the Ministry of Repentance and Holiness — calling the nations to repentance, righteousness, and holiness in preparation for the coming of the Messiah.',
  alternates: { canonical: '/about', types: rssAlternate },
  robots: { index: false, follow: true },
}

export default function AboutPage() {
  return (
    <ComingSoon
      kicker="About"
      title="The Ministry"
      blurb="Who publishes here, and the call the ministry carries to the nations."
      verse="The voice of him that crieth in the wilderness, Prepare ye the way of the LORD."
      reference="Isaiah 40:3"
    />
  )
}
