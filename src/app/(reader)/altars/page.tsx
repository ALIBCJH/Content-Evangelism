import * as React from 'react'
import type { Metadata } from 'next'
import { altarHref, counties, pastoralCare, siteUrl } from '@/lib/content'
import { allAltars, altarPlaceData, awaitingCounties, locatedCounties } from '@/lib/altars'
import { rssAlternate } from '@/lib/seo'
import { AltarFinder } from '@/components/altars/altar-finder'
import { AskQuestion } from '@/components/ask-question'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'

/**
 * Where the ministry meets, as a page rather than as the last section of
 * another one.
 *
 * It was a flat list at the bottom of /about, which is the right place
 * for it if the question is "how big is this ministry" and the wrong one
 * if the question is "where do I go on Sunday" — the second reader had to
 * read six sections about the mission first, and then scan twenty-six
 * cards for their own county with nothing to search and nothing to point
 * at. So the altars have their own address, their own map and their own
 * search box, and /about keeps the summary and hands them over.
 *
 * Each altar is published here with its coordinates and its Google place
 * as structured data too, so a search for "repentance and holiness
 * Nakuru" can land on the altar rather than on this desk's description
 * of it.
 */

export const metadata: Metadata = {
  title: 'Altars and Locations',
  description:
    'Where the Ministry of Repentance and Holiness meets in Kenya — the main altar in each county, with its place on the map, the road it stands on, and the number to call. Search by county, by altar or by place.',
  alternates: { canonical: '/altars', types: rssAlternate },
}

/** The figures the band prints, counted rather than typed in. */
const stats = [
  { figure: '47', label: 'Counties in Kenya' },
  { figure: String(locatedCounties.length), label: 'With an altar recorded' },
  { figure: String(allAltars.length), label: 'Altars on the map' },
]

export default function AltarsPage() {
  const headOffice = pastoralCare.office.replace('Head office · ', '')

  return (
    <main>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `${siteUrl}/altars`,
          url: `${siteUrl}/altars`,
          name: 'Altars and Locations',
          description:
            'Where the Ministry of Repentance and Holiness meets in Kenya — the main altar in each county.',
          isPartOf: { '@id': `${siteUrl}/#website` },
          about: { '@id': `${siteUrl}/#ministry` },
          inLanguage: 'en',
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: allAltars.length,
            itemListElement: locatedCounties.flatMap((county) =>
              (county.altars ?? []).map((altar) => ({
                '@type': 'ListItem',
                item: altarPlaceData(county, altar, altarHref(altar)),
              })),
            ),
          },
        }}
      />

      {/* ── The band ─────────────────────────────────────────────── */}
      <section className="border-b border-rule bg-raised">
        <div className="shell pb-14 pt-10">
          <Breadcrumbs
            className="mb-7"
            crumbs={[
              { name: 'Home', href: '/' },
              { name: 'About', href: '/about' },
              { name: 'Altars' },
            ]}
          />

          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="kicker mb-4 text-gold">Where we meet</p>
              <h1 className="mb-6 max-w-[20ch] text-balance font-display text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-navy sm:text-[3.25rem]">
                Altars across all forty-seven counties
              </h1>
              <span aria-hidden className="mb-7 block h-[3px] w-16 rounded-full bg-gold" />
              <p className="max-w-[42rem] text-pretty text-[1.0625rem] leading-[1.8] text-ink-700 sm:text-[1.125rem]">
                The ministry is distributed globally — it preaches, holds conferences and gathers
                on every continent it has been invited to. Its home is Kenya, where it meets in all
                forty-seven counties. Find the altar nearest you on the map, or search for it by
                name.
              </p>

              <p className="mt-7 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-subtle">
                <span className="text-gold-ink">Head office</span>
                <span aria-hidden>·</span>
                <span>{headOffice}</span>
              </p>
            </div>

            {/* The three figures the page rests on, counted from the data
                below rather than written into the copy, so the page can
                never claim more ground than it can direct anyone to. */}
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-panel border border-rule bg-rule">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-card px-4 py-6 text-center">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="tabular block font-display text-[1.75rem] leading-none text-navy sm:text-[2.125rem]">
                      {stat.figure}
                    </span>
                    <span
                      aria-hidden
                      className="mt-2.5 block font-mono text-[0.625rem] uppercase leading-[1.5] tracking-[0.08em] text-ink-subtle"
                    >
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="shell py-14 sm:py-16">
        <AltarFinder />

        <p className="mt-12 max-w-measure border-t border-rule pt-8 text-[0.9375rem] leading-[1.75] text-ink-subtle">
          The numbers belong to the clergy leading each altar, where one has been published. An
          altar marked <em>location to confirm</em> is one whose place has been matched but not
          checked on the ground. {awaitingCounties.length} of the {counties.length} counties have
          no meeting place recorded here yet.
        </p>
      </div>

      <AskQuestion title="Where we meet" subject="the altars" />
    </main>
  )
}
