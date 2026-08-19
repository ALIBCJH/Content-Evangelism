import * as React from 'react'
import type { Metadata } from 'next'
import { siteUrl } from '@/lib/content'
import { prophecyRecords, recordHref } from '@/lib/prophecies'
import { rssAlternate } from '@/lib/seo'
import { JsonLd } from '@/components/json-ld'
import { RecordArchive } from '@/components/prophecy/record-archive'

/**
 * The prophecy archive: every published recording, newest first, on a
 * dated rail.
 *
 * Each card carries only what the ministry itself published — the
 * recording, its date, its subject, and the ministry's own designation of
 * it. Independent documentation of what followed lives on the record page,
 * under its own heading, so a source and an outcome are never printed as
 * one another.
 */

export const metadata: Metadata = {
  title: 'Prophecy Archive',
  description:
    'The prophetic record of the Ministry of Repentance and Holiness — every message held with its original recording, publication date, location, and subject.',
  alternates: { canonical: '/prophecies', types: rssAlternate },
}

export const revalidate = 300

export default function PropheciesPage() {
  const records = prophecyRecords

  return (
    <main>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `${siteUrl}/prophecies`,
          url: `${siteUrl}/prophecies`,
          name: 'Prophecy Archive',
          description:
            'The prophetic record of the Ministry of Repentance and Holiness, each message held with its original recording and publication date.',
          isPartOf: { '@id': `${siteUrl}/#website` },
          inLanguage: 'en',
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: records.length,
            itemListElement: records.map((record, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `${siteUrl}${recordHref(record)}`,
              name: record.title,
            })),
          },
        }}
      />

      {/* The head of the archive, which is a signpost and not a page of
          its own: the name of the thing, and the box that searches it. The
          list below is drawn by the same component, since a filtered rail
          has to know what was typed. */}
      <RecordArchive
        records={records}
        header={
          <h1 className="font-display text-[1.75rem] font-medium leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.375rem]">
            Prophecies and their fulfilment
          </h1>
        }
      />
    </main>
  )
}
