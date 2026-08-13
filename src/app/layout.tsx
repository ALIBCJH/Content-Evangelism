import type { Metadata, Viewport } from 'next'
import {
  Fraunces,
  Gentium_Book_Plus,
  IBM_Plex_Sans,
  Inter,
  JetBrains_Mono,
  Newsreader,
} from 'next/font/google'
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

/* ── The reading layer ──────────────────────────────────────────────
 *
 * An article is not chrome, and it is not set in the chrome's type. The
 * three families below carry the teaching itself; the three above carry
 * the site around it. The rule the split runs on is simple — serif for
 * what you read, sans for what you scan — so a reader can tell without
 * being told where the devotional ends and the apparatus begins.
 *
 * All three are declared through `next/font`, which downloads them at
 * build time and serves them from this origin as subset WOFF2. There is
 * no request to Google from a reader's browser, no third-party
 * connection to open on a slow network, and `display: swap` on each, so
 * the text is legible before the fonts land. That matters most for the
 * readers this ministry actually has, on Kenyan mobile data.
 */

/* Article headlines, the italic standfirst, and the chapter headings. At
   300 — the weight is the point. A headline set at 700 shouts; at 300
   the same words are unhurried, which is the register a devotional is
   written in. `opsz` keeps it even from the standfirst up to the h1. */
const newsreader = Newsreader({
  subsets: ['latin'],
  /* Variable across weight and optical size, so no `weight` list: every
     weight from 300 up is available from the one file, and `opsz` keeps
     the standfirst and the 56px headline evenly drawn. */
  axes: ['opsz'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
})

/* Every word of the article body, and the Scripture it quotes.
   SIL built Gentium for scripture typesetting and Bible translation, so
   the Greek and Hebrew transliteration a teaching reaches for — harpazō,
   rapiemur — is native to the face rather than bolted onto it. Its tall
   x-height is what keeps a long passage readable on a phone. */
const gentium = Gentium_Book_Plus({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-gentium',
  display: 'swap',
})

/* Everything that is not prose: the eyebrow, the byline, the citation
   under a quotation, the rail, the key scriptures, the questions at the
   foot. A neutral grotesque, which is the job — it stays out of the way. */
const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
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
        width: 256,
        height: 256,
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
      className={[
        fraunces.variable,
        inter.variable,
        mono.variable,
        newsreader.variable,
        gentium.variable,
        plex.variable,
      ].join(' ')}
    >
      <body>
        <JsonLd data={siteGraph} />
        {children}
      </body>
    </html>
  )
}
