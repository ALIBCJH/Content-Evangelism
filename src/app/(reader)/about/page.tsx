import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  aboutSections,
  faithArticles,
  foundingYear,
  locations,
  missionStatement,
  siteInfo,
  siteUrl,
  visionStatement,
} from '@/lib/content'
import { prophecyRecords } from '@/lib/prophecies'
import { listRealRows } from '@/lib/rows'
import { rssAlternate } from '@/lib/seo'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'

/**
 * About the ministry: who publishes here, what it works from, what it
 * holds to, and where it meets.
 *
 * The figures in the stat row are counted from the archive itself rather
 * than typed in, so the page cannot claim more than the site actually
 * holds. Where the ministry's own published account is needed and has not
 * been supplied, the page says so in the open instead of filling the space
 * with copy nobody can source.
 */

export const metadata: Metadata = {
  title: 'About the Ministry',
  description:
    'About the Ministry of Repentance and Holiness — calling the nations to repentance, righteousness, and holiness in preparation for the coming of the Messiah.',
  alternates: { canonical: '/about', types: rssAlternate },
}

export const revalidate = 300

export default async function AboutPage() {
  const rows = await listRealRows()

  const stats = [
    { value: foundingYear, label: 'Year the ministry was founded' },
    {
      value: String(prophecyRecords.length),
      label: prophecyRecords.length === 1 ? 'Prophetic record in the archive' : 'Prophetic records in the archive',
    },
    {
      value: String(rows.length),
      label: rows.length === 1 ? 'Article published' : 'Articles published',
    },
  ]

  return (
    <main>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          '@id': `${siteUrl}/about`,
          url: `${siteUrl}/about`,
          name: 'About the Ministry',
          mainEntity: { '@id': `${siteUrl}/#ministry` },
          isPartOf: { '@id': `${siteUrl}/#website` },
          inLanguage: 'en',
        }}
      />

      {/* ── The band ─────────────────────────────────────────────── */}
      <section className="border-b border-rule bg-raised">
        <div className="shell pb-16 pt-11">
          <Breadcrumbs className="mb-7" crumbs={[{ name: 'Home', href: '/' }, { name: 'About' }]} />

          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-[72px]">
            <div>
              <h1 className="mb-5 font-display text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-navy sm:text-[3.625rem]">
                About the Ministry
              </h1>
              <p className="max-w-[640px] text-pretty text-[1.0625rem] leading-[1.7] text-ink-700 sm:text-[1.125rem]">
                The Ministry of Repentance and Holiness is a Christian ministry calling
                the nations to repentance, holiness, and preparation for the coming of
                the Messiah. This section sets out what it works from, what it holds
                to, and where it meets.
              </p>
            </div>

            <nav aria-label="In this section" className="lg:border-l lg:border-rule lg:pl-10">
              <p className="kicker mb-3.5 text-ink-subtle">In this section</p>
              <ul>
                {aboutSections.map((section) => (
                  <li key={section.href}>
                    <a
                      href={section.href}
                      className="flex justify-between gap-4 border-b border-rule-soft py-2.5 text-sm text-ink-700 transition-colors hover:text-gold"
                    >
                      <span>{section.label}</span>
                      <span aria-hidden className="font-mono text-[0.6875rem] text-gold">
                        →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </section>

      <div className="shell grid gap-12 pb-24 pt-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-[72px]">
        <div>
          {/* ── The ministry ───────────────────────────────────── */}
          <h2
            id="ministry"
            className="mb-6 scroll-mt-stick font-display text-[0.9375rem] font-medium uppercase tracking-[0.12em] text-navy"
          >
            The Ministry
          </h2>
          <p className="mb-5 max-w-measure text-[1.0625rem] leading-[1.75] text-ink-900 sm:text-[1.1875rem]">
            The ministry is led by {siteInfo.head} and works from Nairobi, Kenya. Its
            proclamation is stated in four words — the Messiah is coming — and
            everything published here serves it: teachings that open the Scriptures,
            a prophetic record held with its sources, and the call to repentance and
            holiness that both are for.
          </p>
          <p className="mb-9 max-w-measure text-[1.0625rem] leading-[1.8] text-ink-700 sm:text-[1.125rem]">
            This site is the ministry&rsquo;s digital record. Writing is published with
            its date and the Scriptures it rests on; prophetic messages are held
            separately, each with its original recording, so that a source, an event,
            and an interpretation of that event are never read as one another.
          </p>

          <dl className="mb-14 grid gap-5 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-figure border border-rule bg-card p-6">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="tabular mb-2 block font-display text-[2.375rem] font-medium leading-none text-navy">
                    {stat.value}
                  </span>
                  <span className="block text-[0.8125rem] leading-[1.5] text-ink-muted">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          {/* ── Vision and mission ─────────────────────────────── */}
          <h2
            id="mission"
            className="mb-6 scroll-mt-stick font-display text-[0.9375rem] font-medium uppercase tracking-[0.12em] text-navy"
          >
            Vision and Mission
          </h2>
          <div className="mb-14 grid gap-5 md:grid-cols-2">
            {[visionStatement, missionStatement].map((statement) => (
              <div key={statement.kicker} className="rounded-panel border border-rule bg-card p-6 sm:p-8">
                <p className="kicker mb-3.5 text-gold">{statement.kicker}</p>
                <h3 className="mb-3.5 font-display text-[1.5rem] font-medium leading-[1.15] text-navy">
                  {statement.title}
                </h3>
                <p className="mb-5 text-[0.9375rem] leading-[1.75] text-ink-700">
                  {statement.body}
                </p>
                <p className="flex flex-wrap gap-2 border-t border-rule-soft pt-4">
                  {statement.refs.map((ref) => (
                    <span key={ref} className="chip">
                      {ref}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>

          {/* ── Statement of faith ─────────────────────────────── */}
          <h2
            id="faith"
            className="mb-6 scroll-mt-stick font-display text-[0.9375rem] font-medium uppercase tracking-[0.12em] text-navy"
          >
            Statement of Faith
          </h2>
          <p className="mb-7 max-w-measure text-[1.0625rem] leading-[1.8] text-ink-700">
            Each article of faith is published with the Scriptures that support it and
            the teachings that expand on it, rather than as a document to download.
          </p>
          <ol className="mb-8 overflow-hidden rounded-panel border border-rule bg-card">
            {faithArticles.map((article) => (
              <li
                key={article.num}
                className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-5 border-b border-rule-soft px-6 py-5 last:border-b-0 sm:px-7"
              >
                <span className="font-mono text-xs text-gold">{article.num}</span>
                <span className="block">
                  <span className="mb-1 block font-display text-[1.25rem] text-navy">
                    {article.title}
                  </span>
                  <span className="block font-mono text-[0.6875rem] text-ink-subtle">
                    {article.refs}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          {/* The design's own device: where the ministry's published
              wording is needed and has not been supplied, the page says so
              rather than paraphrasing something unsourced into print. */}
          <div className="rounded-figure border border-dashed border-[#C9906A] bg-[#FBF0E9] px-6 py-6">
            <p className="kicker-lg mb-3 text-[#A85B32]">
              [Source needed — do not publish as is]
            </p>
            <p className="text-[0.9375rem] leading-[1.75] text-[#5C4636]">
              The full text of each article of faith, and the ministry&rsquo;s own account
              of its history and leadership, are to be set here verbatim from the
              published wording — not summarised. Supply the source (magazine volume
              and page, or the page on repentandpreparetheway.org) and it is typed in
              exactly as published.
            </p>
          </div>
        </div>

        {/* ── Locations ────────────────────────────────────────── */}
        <aside className="self-start lg:sticky lg:top-stick">
          <div id="locations" className="scroll-mt-stick rounded-panel border border-rule bg-card p-6">
            <p className="kicker mb-4 text-ink-subtle">Locations</p>
            <ul>
              {locations.map((location) => (
                <li key={location.city} className="border-b border-rule-soft py-3 last:border-b-0">
                  <span className="block text-[0.9375rem] font-medium text-navy">
                    {location.city}
                  </span>
                  <span className="block text-[0.8125rem] text-ink-subtle">{location.detail}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5">
              <Link
                href="/articles"
                className="font-mono text-[0.6875rem] text-navy transition-colors hover:text-gold"
              >
                READ THE ARCHIVE →
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
