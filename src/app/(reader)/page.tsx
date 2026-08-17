import * as React from 'react'
import type { Metadata } from 'next'
import { siteUrl } from '@/lib/content'
import { rssAlternate } from '@/lib/seo'
import { ArchiveView } from '@/components/archive/archive-view'
import { JsonLd } from '@/components/json-ld'

/**
 * The front page is the archive.
 *
 * There was a landing page in front of it — a proclamation, one featured
 * teaching, and the two statements — and it stood between a reader and
 * the writing. The ministry publishes; what it publishes is the thing to
 * open on. So the archive moved here, and /articles permanently redirects
 * to it. The teachings themselves keep their /articles/<slug> URLs, which
 * are the ones that are linked and indexed.
 */

export const metadata: Metadata = {
  title: {
    absolute: 'Repent and Prepare the Way — Teachings, Prophecies & Oracles',
  },
  description:
    'Long-form writing from the Ministry of Repentance and Holiness. Scripture examined passage by passage, with the questions readers ask answered plainly.',
  alternates: { canonical: '/', types: rssAlternate },
}

/* Statically served and rebuilt every five minutes; the posting desk also
   revalidates this path on publish, so a new piece appears at once. */
export const revalidate = 300

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${siteUrl}/#webpage`,
          url: siteUrl,
          name: 'Repent and Prepare the Way',
          isPartOf: { '@id': `${siteUrl}/#website` },
          about: { '@id': `${siteUrl}/#ministry` },
          inLanguage: 'en',
        }}
      />
      <ArchiveView
        kicker="Articles"
        title="Articles"
        emptyMessage="Nothing has been published yet. The first piece will open here."
        collection={{
          name: 'The Archive',
          description:
            'Every teaching, prophecy, and oracle published by the Ministry of Repentance and Holiness.',
          path: '/',
        }}
      />
    </>
  )
}
