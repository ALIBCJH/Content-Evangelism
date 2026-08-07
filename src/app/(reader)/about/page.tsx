import * as React from 'react'
import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = {
  title: 'About',
  description:
    'About the Ministry of Repentance and Holiness — calling the nations to repentance, righteousness, and holiness in preparation for the coming of the Messiah.',
  alternates: { canonical: '/about' },
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
