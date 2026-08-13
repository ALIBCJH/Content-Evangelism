import * as React from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { siteUrl } from '@/lib/content'
import { posterSrc, prophecyRecords, recordHref } from '@/lib/prophecies'
import { rssAlternate } from '@/lib/seo'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { DatedRail, DatedRailItem } from '@/components/archive/dated-rail'
import { FulfilledBadge } from '@/components/prophecy/fulfilled-badge'

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

      <section className="border-b border-rule bg-raised">
        <div className="shell pb-9 pt-7">
          <Breadcrumbs
            className="mb-6"
            crumbs={[{ name: 'Home', href: '/' }, { name: 'Prophecy Archive' }]}
          />
          <h1 className="font-display text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-navy sm:text-[3.625rem]">
            Prophecy Archive
          </h1>
          <p className="mt-4 max-w-[660px] text-[1.0625rem] leading-[1.7] text-ink-700">
            Each record holds the original recording as its primary source, with the
            publication date, location, and subject as the ministry published them.
          </p>
        </div>
      </section>

      <section className="shell pb-24 pt-9">
        <div className="flex items-center justify-between pb-6 pt-2">
          <span className="kicker-lg text-ink-subtle">
            {records.length} {records.length === 1 ? 'record' : 'records'}
          </span>
          <span className="kicker-lg text-ink-subtle">Newest first</span>
        </div>

        {/* The rail is shared with the article archive — see dated-rail.
            A record whose year is still to be confirmed leaves its marker
            unlabelled rather than printing a placeholder dash. */}
        <DatedRail>
          {records.map((record) => (
            <DatedRailItem
              key={record.id}
              year={record.year === '—' ? null : record.year}
            >
              <Link
                href={recordHref(record)}
                className="card card-interactive my-3 flex flex-col items-start gap-6 p-5 sm:ml-8 sm:p-8 lg:flex-row lg:gap-7"
              >
                <span className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden rounded-tile border border-rule bg-navy-deep lg:w-[260px]">
                  <Image
                    src={posterSrc(record.video)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 260px, 100vw"
                    className="object-cover"
                  />
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 flex h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-navy/80"
                  >
                    <svg width="13" height="16" viewBox="0 0 20 24" fill="#F7F4EC">
                      <path d="M2 2l16 10L2 22z" />
                    </svg>
                  </span>
                </span>

                <span className="block min-w-0 flex-1">
                  <span className="mb-3.5 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[0.6875rem] tracking-[0.08em] text-navy">
                      {record.date}
                    </span>
                    <span className="kicker rounded-chip border border-gold-pale/70 px-2.5 py-1 text-gold">
                      Primary Source
                    </span>
                    {record.fulfilled && <FulfilledBadge />}
                  </span>

                  <span className="mb-3.5 block text-balance font-display text-[1.375rem] font-medium leading-[1.15] text-navy sm:text-[1.875rem]">
                    {record.title}
                  </span>

                  <span className="mb-4 block max-w-[720px] text-[0.9375rem] leading-[1.7] text-ink-muted">
                    {record.summary}
                  </span>

                  <span className="flex flex-wrap items-center justify-between gap-4 border-t border-rule-soft pt-4">
                    <span className="flex flex-wrap gap-2">
                      {record.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-chip bg-chip px-3 py-1.5 text-xs text-ink-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                    <span className="whitespace-nowrap font-mono text-[0.6875rem] text-navy">
                      VIEW RECORD →
                    </span>
                  </span>
                </span>
              </Link>
            </DatedRailItem>
          ))}
        </DatedRail>
      </section>
    </main>
  )
}
