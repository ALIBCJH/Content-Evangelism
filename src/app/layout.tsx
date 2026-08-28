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
  /* Variable across weight only. It carried `opsz` as well, on the sound
     reasoning that the design runs headlines from 19px to 84px and that
     is exactly the range optical sizing exists to keep even — but the
     axis is not free, and it was not cheap here: 67kB against 37kB for
     the same family without it, and 132kB against 58kB for Newsreader
     next door. 104kB of the 374kB this site preloaded on every page was
     being spent on optical sizing.

     On the connections this ministry's readers actually have, a second
     of blank headline costs more than an evenly drawn one earns. The
     axis is a refinement; arriving is not. */
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
 *
 * All of them are preloaded, and that was measured rather than assumed.
 * Six families is a lot of font files racing each other on a slow
 * connection, and taking the preload off the reading layer to clear the
 * way for the chrome looked obviously right: it cost 1.5s of First
 * Contentful Paint and 2s of Speed Index, because a face nobody has
 * asked for yet is a face the browser does not start fetching until it
 * has laid the text out. It was tried, it was worse, it is not here.
 *
 * What was reduced instead is the size of what gets preloaded, which is a
 * different question from how many things do. Two changes, together worth
 * 135kB of the 374kB that used to be on the critical path of every page:
 * the optical-size axis is gone from both display serifs (see Fraunces
 * above), and Gentium's bold is a second, unpreloaded instance (see
 * below). Every face a page opens with still arrives with the page.
 */

/* Article headlines, the italic standfirst, and the chapter headings. At
   300 — the weight is the point. A headline set at 700 shouts; at 300
   the same words are unhurried, which is the register a devotional is
   written in. `opsz` keeps it even from the standfirst up to the h1. */
const newsreader = Newsreader({
  subsets: ['latin'],
  /* Variable across weight, so no `weight` list: every weight from 300 up
     is available from the one file. `opsz` was here too and was the
     single most expensive thing this site downloaded — 132kB, against
     58kB for the same face without it. See the note on Fraunces. */
  /* Upright only, and the italic is declared separately below. The
     italic used to be on this instance, rendering nowhere, and because
     `next/font` preloads every face it is given it was the single
     largest download on the site: 144kB of variable font fetched on
     every page, ahead of the text, to draw nothing. */
  variable: '--font-newsreader',
  display: 'swap',
})

/* The same face's italic, for the body — which is set in Newsreader now,
   and which reaches for italic 42 times across the teachings: the Greek
   and Hebrew a teaching transliterates (harpazō, metanoia, qadosh), and
   the phrases it lifts out of a verse to examine. A browser asked for
   italic with no italic face to hand slants the upright one, and a
   slanted serif on a page of real ones reads as a rendering fault.
   Its own instance for one reason: `preload: false`. This is a small
   fraction of the words on any page, so it is fetched when the browser
   actually meets one rather than raced against the text on a Kenyan
   mobile connection, and `display: swap` covers the gap. That is the
   opposite call from the body face itself, where taking the preload off
   was measured at 1.5s of First Contentful Paint and put straight back. */
const newsreaderItalic = Newsreader({
  subsets: ['latin'],
  style: ['italic'],
  variable: '--font-newsreader-italic',
  display: 'swap',
  preload: false,
})

/* Every word of the article body, and the Scripture it quotes.
   SIL built Gentium for scripture typesetting and Bible translation, so
   the Greek and Hebrew transliteration a teaching reaches for — harpazō,
   rapiemur — is native to the face rather than bolted onto it. Its tall
   x-height is what keeps a long passage readable on a phone. */
const gentium = Gentium_Book_Plus({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-gentium',
  display: 'swap',
})

/* The same face's bold, on its own instance for one reason: `preload:
   false`. Gentium is not a variable font, so each weight and style is a
   file of its own, and all four were preloaded — 63kB racing the page to
   draw the two that a teaching opens with.

   Upright 400 is the body of every reading block and italic 400 is the
   Scripture the front page leads with, so both stay on the critical
   path. Bold is a <strong> inside a statement panel: a handful of words
   on the pages that have any, and none at all on most. It is fetched
   when the browser meets one, and `display: swap` covers the moment.

   This is the same call the italic next door makes, for the same reason,
   and it is why `.font-reading strong` has to be named in globals.css —
   a family that holds only 400 does not answer a request for 700, it
   smears the 400 into a synthetic bold. */
const gentiumBold = Gentium_Book_Plus({
  subsets: ['latin'],
  weight: ['700'],
  style: ['normal', 'italic'],
  variable: '--font-gentium-bold',
  display: 'swap',
  preload: false,
})

/* Everything that is not prose: the eyebrow, the byline, the citation
   under a quotation, the rail, the key scriptures, the questions at the
   foot. A neutral grotesque, which is the job — it stays out of the way. */
const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  /* 700 is here for one thing: the headline at the head of a teaching,
     which is set in this face rather than the reading serif. */
  weight: ['400', '500', '600', '700'],
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
  /* The page is laid out under the notch and the home indicator, and the
     things pinned to the edges stand themselves off it with
     `env(safe-area-inset-*)` — which returns zero without this, so the
     audio bar's own safe-area padding had been doing nothing since it was
     written. */
  viewportFit: 'cover',
  colorScheme: 'light',
  /* One, and light, because that is what a reader is given on arrival
     whatever their machine is set to. A pair keyed on the system
     preference would put dark chrome around a light page on a machine kept
     dark, which is the mismatch this used to avoid and would now cause.
     The toggle updates this tag as it goes, so the chrome follows a reader
     who chooses dark rather than following their operating system. */
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
      /* The machine-readable half of the same archive. An agent that has
         parsed this page's structured data has now been told the API
         exists and where its specification is, without having to guess a
         path or find the robots file first. */
      subjectOf: { '@id': `${siteUrl}/#api` },
    },
    {
      '@type': 'WebAPI',
      '@id': `${siteUrl}/#api`,
      name: `${siteInfo.name} — public content API`,
      description:
        'Read-only JSON access to the published archive: written teachings, the prophetic record, and recorded sermons.',
      url: `${siteUrl}/api/v1`,
      documentation: `${siteUrl}/api/openapi.json`,
      provider: { '@id': `${siteUrl}/#ministry` },
      inLanguage: 'en',
      isAccessibleForFree: true,
    },
  ],
}

/**
 * The theme, decided before the first paint.
 *
 * This runs in the head, synchronously, ahead of any stylesheet, and it
 * answers one question: has this reader chosen a theme here? A stored
 * choice wins. Everything else is light.
 *
 * The site used to follow the operating system when nothing was stored,
 * which is the usual advice and the wrong answer for this publication.
 * The page a reader is given on arrival is the page the ministry is
 * publishing, and it is set on white: this is a publication, read at
 * length, and the light setting is the one the type, the plates and the
 * photographs were composed against. A machine kept dark for a terminal
 * at night is not a statement about how somebody wants to read a
 * teaching, and it was being read as one — a reader who had never
 * expressed a preference here was shown a version of the site they had
 * not asked for, and had to find a control to see the one they had.
 *
 * The dark theme is not going anywhere. It is one press away, it is
 * remembered for good once pressed, and a reader who has pressed it is
 * never overruled by any of this. What changed is only which way the
 * question falls when nobody has answered it.
 *
 * Still tiny and still silent: any failure at all — a browser with
 * storage blocked — leaves the attribute unset, and unset is light,
 * because light is what `:root` alone declares.
 */
const themeScript = `try{var t=localStorage.getItem('theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      /* The theme attribute is written by the script below before React
         hydrates, so the server's markup and the client's differ here by
         design. */
      suppressHydrationWarning
      className={[
        fraunces.variable,
        inter.variable,
        mono.variable,
        newsreader.variable,
        newsreaderItalic.variable,
        gentium.variable,
        gentiumBold.variable,
        plex.variable,
      ].join(' ')}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <JsonLd data={siteGraph} />
        {children}
      </body>
    </html>
  )
}
