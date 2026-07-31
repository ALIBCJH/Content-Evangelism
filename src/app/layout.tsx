import type { Metadata } from 'next'
import { Fraunces, Montserrat, Newsreader } from 'next/font/google'
import { radioChannel, siteInfo, siteUrl, youtubeChannel } from '@/lib/content'
import { JsonLd } from '@/components/json-ld'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://repentandpreparetheway.org'),
  title: {
    default: 'Repent and Prepare the Way — Ministry of Repentance and Holiness',
    template: '%s · Repent and Prepare the Way',
  },
  description:
    'The publication desk of the Ministry of Repentance and Holiness — teachings, prophecies, oracles, Bible study guides, and devotionals, faithfully told.',
  keywords: [
    'Christian teachings', 'prophecy', 'oracles', 'Bible study', 'devotionals',
    'sermons', 'church publication', 'Christian articles', 'repentance', 'holiness',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Repent and Prepare the Way',
    title: 'Repent and Prepare the Way — Ministry of Repentance and Holiness',
    description:
      'Teachings, prophecies, and oracles from the Ministry of Repentance and Holiness — faithfully told.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Repent and Prepare the Way',
    description:
      'Teachings, prophecies, and oracles from the Ministry of Repentance and Holiness — faithfully told.',
  },
  robots: { index: true, follow: true },
}

/* Site-wide knowledge graph, server-rendered so every crawler — including
   the AI ones that never run JavaScript — can read who publishes this
   site, who leads the ministry, and where the official channels live. */
const siteGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#ministry`,
      name: siteInfo.ministry,
      alternateName: ['Repentance and Holiness', siteInfo.name],
      url: siteUrl,
      founder: { '@type': 'Person', name: siteInfo.head },
      description:
        'A global Christian ministry calling the nations to repentance, righteousness, and holiness in preparation for the coming of the Messiah.',
      sameAs: [youtubeChannel.href, radioChannel.href],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: siteInfo.name,
      description:
        'The publication desk of the Ministry of Repentance and Holiness — teachings, prophecies, oracles, Bible study guides, and devotionals.',
      publisher: { '@id': `${siteUrl}/#ministry` },
      inLanguage: 'en',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${newsreader.variable} ${montserrat.variable}`}
    >
      <body>
        {/* Static, synchronous theme bootstrap — runs before first paint. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
        <JsonLd data={siteGraph} />
        {children}
      </body>
    </html>
  )
}
