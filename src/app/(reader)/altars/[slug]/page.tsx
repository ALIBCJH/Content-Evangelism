import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Phone } from 'lucide-react'
import { altarHref, pastoralCare, siteInfo, siteUrl } from '@/lib/content'
import {
  altarBySlug,
  altarEntries,
  altarPath,
  altarPlaceData,
  countyNumber,
  entriesIn,
  nearestEntries,
} from '@/lib/altars'
import { rssAlternate } from '@/lib/seo'
import { AskQuestion } from '@/components/ask-question'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { CountyInset } from '@/components/altars/county-inset'
import { buttonVariants } from '@/components/ui/button'

/**
 * One altar, at an address of its own.
 *
 * The finder answers "which counties"; this page answers the question a
 * search engine is actually asked — "repentance and holiness church
 * nakuru" — and it cannot be answered by a page carrying twenty-seven
 * altars in one list. There is no ranking a single URL for twenty-seven
 * towns. So each altar has its own page, its own `Church` record, and its
 * own place on the map, drawn close enough to be worth looking at.
 *
 * Everything on it is the ministry's own: the name it gave, the ground it
 * named, the number its clergy published. Where something has not been
 * supplied — the service times, most of all — the page says so rather
 * than filling the line with copy nobody can source. A reader who drives
 * to a locked gate because this page guessed is a reader this desk has
 * failed.
 */

export const revalidate = 300

interface Params {
  params: { slug: string }
}

export function generateStaticParams() {
  return altarEntries.map((entry) => ({ slug: entry.slug }))
}

export function generateMetadata({ params }: Params): Metadata {
  const entry = altarBySlug(params.slug)
  if (!entry) return { title: 'Altar not found', robots: { index: false, follow: false } }

  const { altar, county } = entry
  const description = `${altar.name} — where the ${siteInfo.ministry} meets in ${county.name} County, Kenya. ${altar.area}. Directions, the place on the map${
    altar.phone ? ', and the number to call' : ''
  }.`

  return {
    title: `${altar.name} — ${county.name} County`,
    description,
    keywords: [
      altar.name,
      `${county.name} County`,
      'altar',
      'church',
      siteInfo.ministry,
      siteInfo.head,
    ],
    alternates: { canonical: altarPath(entry), types: rssAlternate },
    openGraph: {
      type: 'website',
      title: `${altar.name} — ${county.name} County`,
      description,
      url: altarPath(entry),
    },
  }
}

export default function AltarPage({ params }: Params) {
  const entry = altarBySlug(params.slug)
  if (!entry) notFound()

  const { altar, county } = entry
  const others = entriesIn(county).filter((other) => other.slug !== entry.slug)
  const nearest = nearestEntries(entry, 4)
  const mapHref = altarHref(altar)

  /* The record itself: the county, the ground, the coordinates the pin is
     built from, and the number where the clergy published one. */
  const record = [
    { key: 'County', value: `${county.name} — no. ${countyNumber(county.no)} of 47` },
    { key: 'Address', value: altar.area },
    { key: 'Coordinates', value: `${altar.at[0].toFixed(5)}, ${altar.at[1].toFixed(5)}` },
    ...(altar.phone ? [{ key: 'Telephone', value: altar.phone }] : []),
  ]

  return (
    <main>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          ...altarPlaceData(county, altar, mapHref),
          '@id': `${siteUrl}${altarPath(entry)}#altar`,
          url: `${siteUrl}${altarPath(entry)}`,
          parentOrganization: { '@id': `${siteUrl}/#ministry` },
          containedInPlace: { '@type': 'AdministrativeArea', name: `${county.name} County` },
        }}
      />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Altars', item: `${siteUrl}/altars` },
            { '@type': 'ListItem', position: 3, name: altar.name },
          ],
        }}
      />

      {/* ── The band ─────────────────────────────────────────────── */}
      <section className="border-b border-rule bg-raised">
        <div className="shell pb-12 pt-10">
          <Breadcrumbs
            className="mb-7"
            crumbs={[
              { name: 'Home', href: '/' },
              { name: 'Altars', href: '/altars' },
              { name: county.name },
            ]}
          />

          <p className="kicker mb-4 text-gold">
            {countyNumber(county.no)} · {county.name} County
          </p>
          <h1 className="mb-5 max-w-[24ch] text-balance font-display text-[2rem] font-medium leading-[1.08] tracking-[-0.02em] text-navy sm:text-[2.75rem]">
            {altar.name}
          </h1>
          <p className="mb-7 max-w-measure text-[1.0625rem] leading-[1.75] text-ink-700 sm:text-[1.125rem]">
            {altar.area} — where the {siteInfo.ministry} gathers in {county.name} County.
          </p>

          {altar.confirmed === false && (
            <p className="mb-7 max-w-measure rounded-tile border border-source-rule bg-source-bg px-5 py-4 text-[0.875rem] leading-[1.65] text-source-ink">
              <span className="mb-1 block font-mono text-[0.625rem] uppercase tracking-[0.08em] text-source-label">
                Location to confirm
              </span>
              This altar&rsquo;s place has been matched but not checked on the ground. The pin is
              our best reading of it — call ahead before travelling.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ className: 'gap-2.5 px-7' })}
            >
              Open in Maps
              <ArrowUpRight aria-hidden />
            </a>
            {altar.phone && (
              <a
                href={`tel:${altar.phone.replace(/\s/g, '')}`}
                className={buttonVariants({ variant: 'outline', className: 'gap-2.5 px-7' })}
              >
                <Phone aria-hidden />
                {altar.phone}
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="shell grid items-start gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:gap-16">
        {/* ── Where it stands ────────────────────────────────────── */}
        <div>
          <div className="grid max-w-measure gap-8 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] sm:gap-10">
            <figure className="rounded-panel border border-rule bg-card p-4">
              <CountyInset county={county} at={altar.at} />
              <figcaption className="mt-3 border-t border-rule-soft pt-3 text-center font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-subtle">
                {county.name} County
              </figcaption>
            </figure>

            <dl className="divide-y divide-rule-soft">
              {record.map((line) => (
                <div key={line.key} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 py-3.5 first:pt-0">
                  <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-subtle">
                    {line.key}
                  </dt>
                  <dd className="text-[0.9375rem] leading-[1.5] text-ink-900">{line.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* The one thing this page cannot yet tell a reader, said plainly
              rather than left as a gap they discover on a Sunday morning. */}
          <div className="mt-10 max-w-measure rounded-panel border border-statement-rule bg-statement-bg p-7">
            <p className="kicker mb-3 text-gold-ink">Before you travel</p>
            <p className="max-w-measure font-reading text-[1.0625rem] leading-[1.6] text-navy">
              Service times for this altar have not been published here. Call the number on this
              page where one is given, or the head office on{' '}
              {pastoralCare.lines[0]?.contacts[0]?.text}, and the ministry will tell you when it
              gathers.
            </p>
          </div>
        </div>

        {/* ── What else is near ──────────────────────────────────── */}
        <aside className="lg:border-l lg:border-rule lg:pl-12">
          {others.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 inline-block border-b-[3px] border-gold pb-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-navy">
                Also in {county.name}
              </h2>
              <ul>
                {others.map((other) => (
                  <AltarRow key={other.slug} entry={other} lead="altar" />
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-4 inline-block border-b-[3px] border-gold pb-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-navy">
              Nearest altars
            </h2>
            <ul>
              {nearest.map(({ entry: near, km }) => (
                <AltarRow key={near.slug} entry={near} km={km} />
              ))}
            </ul>
            <p className="mt-4 text-[0.8125rem] leading-[1.6] text-ink-subtle">
              Distances are straight-line, not by road.
            </p>
          </section>

          <Link
            href="/altars"
            className={buttonVariants({ variant: 'outline', className: 'mt-8 w-full gap-2.5' })}
          >
            <ArrowLeft aria-hidden />
            All altars
          </Link>
        </aside>
      </div>

      <AskQuestion title={altar.name} subject="this altar" />
    </main>
  )
}

/**
 * One altar on a rail: where it is, and how far off if that matters.
 *
 * Which line leads depends on what the rail is for. Under "nearest" the
 * county is the thing being compared and belongs on top; under "also in
 * Laikipia" the county is already known, and printing it twice tells the
 * reader nothing they did not have.
 */
function AltarRow({
  entry,
  km,
  lead = 'county',
}: {
  entry: { slug: string; county: { name: string; no: number }; altar: { name: string; area: string } }
  km?: number
  lead?: 'county' | 'altar'
}) {
  const [title, under] =
    lead === 'altar'
      ? [entry.altar.name, entry.altar.area]
      : [entry.county.name, entry.altar.name]

  return (
    <li className="border-b border-rule last:border-b-0">
      <Link
        href={`/altars/${entry.slug}`}
        className="focus-ring group -mx-2 flex items-baseline gap-3 rounded-tile px-2 py-3 transition-colors hover:bg-chip-gold/50"
      >
        <span
          aria-hidden
          className="tabular w-5 shrink-0 font-apparatus text-[0.8125rem] font-bold leading-none text-gold"
        >
          {countyNumber(entry.county.no)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-apparatus text-[0.9375rem] font-semibold leading-[1.3] text-navy transition-colors group-hover:text-gold-ink">
            {title}
          </span>
          <span className="mt-0.5 block text-[0.8125rem] leading-[1.45] text-ink-subtle">
            {under}
          </span>
        </span>
        {km !== undefined && (
          <span className="tabular shrink-0 font-mono text-[0.6875rem] text-ink-subtle">
            {Math.round(km)} km
          </span>
        )}
      </Link>
    </li>
  )
}
