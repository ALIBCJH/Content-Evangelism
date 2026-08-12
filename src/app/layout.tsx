import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'
import { siteInfo, siteUrl } from '@/lib/content'
import {
  contactEmail,
  googleVerification,
  rssAlternate,
  socialProfiles,
  twitterHandle,
} from '@/lib/seo'
import { JsonLd } from '@/components/json-ld'
import './globals.css'

/* Display: every headline, standfirst, card title, and pull quote. */
const fraunces = Fraunces({
  subsets: ['latin'],
  /* Variable across weight and optical size — the design sets headlines
     at 500 and runs them from 19px to 84px, which is exactly the range
     `opsz` exists to keep even. */
  axes: ['opsz'],
  variable: '--font-fraunces',
  display: 'swap',
})

/* Text: running copy, deks, navigation, and every piece of UI. */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

/* Mono: kickers, datelines, record IDs, and Scripture references. */
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Repent and Prepare the Way — Ministry of Repentance and Holiness',
    template: '%s · Repent and Prepare the Way',
  },
  description:
    'The publication desk of the Ministry of Repentance and Holiness — teachings, prophecies, oracles, Bible study guides, and devotionals, faithfully told.',
  applicationName: siteInfo.name,
  authors: [{ name: siteInfo.ministry, url: siteUrl }],
  creator: siteInfo.ministry,
  publisher: siteInfo.ministry,
  category: 'Religion & Spirituality',
  keywords: [
    'Christian teachings', 'prophecy', 'oracles', 'Bible study', 'devotionals',
    'sermons', 'church publication', 'Christian articles', 'repentance', 'holiness',
  ],
  alternates: { canonical: '/', types: rssAlternate },
  openGraph: {
    type: 'website',
    siteName: 'Repent and Prepare the Way',
    title: 'Repent and Prepare the Way — Ministry of Repentance and Holiness',
    description:
      'Teachings, prophecies, and oracles from the Ministry of Repentance and Holiness — faithfully told.',
    url: siteUrl,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Repent and Prepare the Way',
    description:
      'Teachings, prophecies, and oracles from the Ministry of Repentance and Holiness — faithfully told.',
    ...(twitterHandle ? { site: twitterHandle, creator: twitterHandle } : {}),
  },
  /* max-image-preview:large is what earns the full-width thumbnail in
     mobile results and makes a page eligible for Discover; the snippet
     limits are lifted so the whole teaching can be quoted. */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  formatDetection: { telephone: false, address: false, email: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
  themeColor: '#123B5D',
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
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
      },
      founder: { '@type': 'Person', name: siteInfo.head },
      description:
        'A global Christian ministry calling the nations to repentance, righteousness, and holiness in preparation for the coming of the Messiah.',
      sameAs: socialProfiles,
      ...(contactEmail
        ? {
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'General enquiries',
              email: contactEmail,
              availableLanguage: ['en'],
            },
          }
        : {}),
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
      copyrightHolder: { '@id': `${siteUrl}/#ministry` },
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
      className={`${fraunces.variable} ${inter.variable} ${mono.variable}`}
    >
      <body>
        <JsonLd data={siteGraph} />
        {children}
      </body>
    </html>
  )
}
