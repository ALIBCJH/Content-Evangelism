import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  aboutSections,
  counties,
  faithArticles,
  foundingYear,
  mapsHref,
  pastoralCare,
  siteInfo,
  siteUrl,
} from '@/lib/content'
import { prophecyRecords } from '@/lib/prophecies'
import { listRealRows } from '@/lib/rows'
import { rssAlternate } from '@/lib/seo'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'

/**
 * About the ministry: who publishes here, what they are saying, what the
 * archive holds, and what the desk holds to.
 *
 * The page used to run as one column of prose with the occasional panel
 * in it, and it read as one long thing about several subjects. It is a
 * stack of sections now, one subject each, every one announced by its own
 * heading and given a device of its own — a ladder, a set of cards, a
 * quoted verse, a row of counters. A reader looking for the mission
 * should find it by passing three headings, not by reading four
 * paragraphs to see whether this one is it.
 *
 * The figures are counted from the archive itself rather than typed in,
 * so the page cannot claim more than the site actually holds. Where the
 * ministry's own published account is needed and has not been supplied,
 * the page says so in the open instead of filling the space with copy
 * nobody can source.
 */

export const metadata: Metadata = {
  title: 'About the Ministry',
  description:
    'Who publishes this archive and what is in it. The Ministry of Repentance and Holiness — founded in Nairobi in 2005 and led by Prophet Dr. David Owuor — calls the Church to repentance, holiness and readiness for the coming of the Messiah.',
  alternates: { canonical: '/about', types: rssAlternate },
}

export const revalidate = 300

/* ── The page's own copy ─────────────────────────────────────────── */

/** The call, as three movements. The order is the argument. */
const theMessage = [
  {
    num: '01',
    title: 'Repentance',
    body: 'The call to readiness begins here — turning away from sin, and turning back to God.',
  },
  {
    num: '02',
    title: 'Holiness',
    body: 'It continues in a life surrendered to God and set apart for Him, in what a person does and desires.',
  },
  {
    num: '03',
    title: 'The coming Messiah',
    body: 'And it looks toward the hope the whole message is for: Jesus Christ is coming again.',
  },
]

/** The mission in three imperatives, which is how it is preached. */
const theCharge = ['Repent.', 'Live in holiness.', 'Prepare for His coming.']

/** Where a reader goes next, and what they will find when they arrive. */
const doorways = [
  {
    label: 'Teachings',
    href: '/topics/teachings',
    body: 'Biblical teachings, sermons and expositions that open the Word of God and its application to the life of the believer.',
    category: 'Teachings',
  },
  {
    label: 'Prophecy',
    href: '/prophecies',
    body: 'Prophetic messages associated with the ministry, preserved alongside their available records and sources.',
    category: null,
  },
  {
    label: 'Devotionals',
    href: '/topics/devotional',
    body: 'Short reflections for prayer, meditation, and the daily walk with God.',
    category: 'Devotional',
  },
  {
    label: 'Doctrine',
    href: '/topics/doctrine',
    body: 'Teachings exploring foundational Christian belief — Scripture, salvation, the covenants, and the character of God.',
    category: 'Doctrine',
  },
]

/* ── The furniture every section is built from ───────────────────── */

/**
 * One section's opening: the small label, the large heading, and an
 * optional line under it. Every section announces itself the same way,
 * which is what lets a reader skim the page by its headings rather than
 * by its paragraphs.
 */
function SectionHead({
  id,
  eyebrow,
  title,
  lede,
}: {
  id: string
  eyebrow: string
  title: string
  lede?: string
}) {
  return (
    <header className="mb-9">
      <p className="kicker mb-4 text-gold-ink">{eyebrow}</p>
      <h2
        id={id}
        className="max-w-[38rem] scroll-mt-stick text-balance font-display text-[1.75rem] font-medium leading-[1.12] tracking-[-0.015em] text-navy sm:text-[2.25rem]"
      >
        {title}
      </h2>
      {lede && (
        <p className="mt-5 max-w-measure text-pretty text-[1.0625rem] leading-[1.8] text-ink-700 sm:text-[1.125rem]">
          {lede}
        </p>
      )}
    </header>
  )
}

/** A section: one subject, ruled off from the one before it. */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-t border-rule py-16 first:border-t-0 first:pt-0 sm:py-20">
      {children}
    </section>
  )
}

export default async function AboutPage() {
  const rows = await listRealRows()
  const countOf = (category: string) => rows.filter((row) => row.category === category).length

  const stats = [
    { value: foundingYear, label: 'Year the ministry was founded' },
    {
      value: String(prophecyRecords.length),
      label:
        prophecyRecords.length === 1
          ? 'Prophetic record in the archive'
          : 'Prophetic records in the archive',
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
        <div className="shell pb-14 pt-10">
          <Breadcrumbs className="mb-7" crumbs={[{ name: 'Home', href: '/' }, { name: 'About' }]} />

          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-[72px]">
            <div>
              <p className="kicker mb-4 text-gold">Who publishes here</p>
              <h1 className="mb-6 font-display text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-navy sm:text-[3.625rem]">
                About the Ministry
              </h1>

              {/* The call itself, before anything is explained about it.
                  Three sentences, because it is three things, and running
                  them together flattens the order they come in. */}
              <p className="mb-7 max-w-[34rem] font-article text-[1.375rem] font-light leading-[1.35] text-navy sm:text-[1.625rem]">
                A call to repentance. A call to holiness. A call to prepare for the coming of the
                Messiah.
              </p>
              <span aria-hidden className="mb-7 block h-[3px] w-16 rounded-full bg-gold" />

              <p className="max-w-[42rem] text-pretty text-[1.0625rem] leading-[1.8] text-ink-700 sm:text-[1.125rem]">
                The Ministry of Repentance and Holiness is a Christian ministry founded in{' '}
                {foundingYear} and based in Nairobi, Kenya, led by{' '}
                <strong className="font-semibold text-ink-strong">{siteInfo.head}</strong>. This
                platform exists to make its message easier to discover, read, study and share.
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

      <div className="shell pb-24 pt-16">
        {/* ── The ministry ───────────────────────────────────────── */}
        <Section>
          <SectionHead
            id="ministry"
            eyebrow="The Ministry"
            title="The Ministry of Repentance and Holiness"
            lede="The ministry’s message is centred on the call for the Church to return to the Lord in repentance and holiness, and to prepare for the coming of Jesus Christ."
          />
          <p className="max-w-measure text-[1.0625rem] leading-[1.8] text-ink-700 sm:text-[1.125rem]">
            Here you will find teachings, biblical expositions, devotionals, doctrine, and records
            of prophetic messages from the ministry — published with their dates, the Scriptures
            they rest on, and the sources behind them.
          </p>
        </Section>

        {/* ── Why this platform exists ───────────────────────────── */}
        <Section>
          <SectionHead
            id="why"
            eyebrow="Why This Platform Exists"
            title="The written message, brought together in one place"
            lede="For many years the ministry’s message has been shared through preaching, conferences, recordings, publications and evangelistic outreach. As more people search for answers online, there is a growing need for these teachings in a clear and accessible written form."
          />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
            <div className="rounded-panel border border-rule bg-card p-7 sm:p-9">
              <p className="text-[1.0625rem] leading-[1.75] text-ink-700">
                Whether you are discovering the ministry for the first time, looking for a
                particular teaching, studying a biblical subject, or returning to a message you
                have heard before, this archive is built to help you find it.
              </p>
            </div>

            {/* The sentence the whole section is for, given the panel the
                ministry's own voice is set in elsewhere on the site. */}
            <div className="rounded-panel border border-statement-rule bg-statement-bg p-7 sm:p-9">
              <p className="kicker mb-4 text-gold-ink">Our desire is simple</p>
              <p className="font-reading text-[1.1875rem] leading-[1.55] text-navy sm:text-[1.3125rem]">
                That the message of repentance, holiness, and readiness for the coming of the
                Messiah may reach more people, and be understood clearly.
              </p>
            </div>
          </div>
        </Section>

        {/* ── The message ────────────────────────────────────────── */}
        <Section>
          <SectionHead
            id="message"
            eyebrow="The Message"
            title="The Messiah is coming."
            lede="The ministry’s proclamation is built around one urgent claim: Jesus Christ is coming again, and the Church must be ready. The call to readiness runs in three movements, and the order is the argument."
          />

          <ol className="mb-10 grid gap-5 md:grid-cols-3">
            {theMessage.map((step) => (
              <li
                key={step.num}
                className="relative overflow-hidden rounded-panel border border-rule bg-card p-7"
              >
                {/* The numeral is set large and pale behind the words: a
                    reader takes the order from it without reading it. */}
                <span
                  aria-hidden
                  className="tabular pointer-events-none absolute -right-2 -top-4 font-display text-[4.5rem] font-medium leading-none text-gold/10"
                >
                  {step.num}
                </span>
                <span className="relative block font-display text-[1.375rem] leading-[1.2] text-navy">
                  {step.title}
                </span>
                <span className="relative mt-3.5 block text-[0.9375rem] leading-[1.7] text-ink-700">
                  {step.body}
                </span>
              </li>
            ))}
          </ol>

          <figure className="scripture max-w-measure">
            <blockquote className="mb-3.5 font-reading text-[1.1875rem] font-normal leading-[1.6] text-navy sm:text-[1.375rem]">
              Prepare ye the way of the LORD, make straight in the desert a highway for our God.
            </blockquote>
            <figcaption className="font-apparatus text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-gold-ink">
              Isaiah 40:3, KJV
            </figcaption>
          </figure>
        </Section>

        {/* ── The mission ────────────────────────────────────────── */}
        <Section>
          <SectionHead
            id="mission"
            eyebrow="Our Mission"
            title="To prepare the way for the coming of the Messiah."
            lede="The ministry seeks to proclaim the Gospel, call people to repentance, teach the Word of God, and prepare the Church for the return of Jesus Christ."
          />
          <p className="mb-10 max-w-measure text-[1.0625rem] leading-[1.8] text-ink-700 sm:text-[1.125rem]">
            This mission is rooted in the Scriptures, and in the conviction that the Church should
            not live carelessly while it waits for the return of the Lord.
          </p>

          {/* Three imperatives, set as three. Run together in a sentence
              they read as a slogan; on their own lines they read as what
              they are, which is instructions. */}
          <ul className="grid gap-px overflow-hidden rounded-panel border border-statement-rule bg-statement-rule sm:grid-cols-3">
            {theCharge.map((line, index) => (
              <li key={line} className="bg-statement-bg px-7 py-9">
                <span
                  aria-hidden
                  className="tabular mb-4 block font-mono text-[0.6875rem] text-gold-ink"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="block font-display text-[1.5rem] leading-[1.15] text-navy">
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── The doorways ───────────────────────────────────────── */}
        <Section>
          <SectionHead
            id="explore"
            eyebrow="Explore the Message"
            title="Four ways into the archive"
            lede="Everything published here is filed under one of these. The figure beside each is what the archive holds today."
          />

          <ul className="grid gap-5 sm:grid-cols-2">
            {doorways.map((doorway) => {
              const count = doorway.category ? countOf(doorway.category) : prophecyRecords.length
              return (
                <li key={doorway.label}>
                  <Link
                    href={doorway.href}
                    className="focus-ring group flex h-full flex-col rounded-panel border border-rule bg-card p-7 transition-colors hover:border-gold/60 sm:p-8"
                  >
                    <span className="mb-3 flex items-baseline justify-between gap-4">
                      <span className="font-display text-[1.5rem] leading-[1.15] text-navy">
                        {doorway.label}
                      </span>
                      <span className="tabular font-mono text-[0.6875rem] text-gold-ink">
                        {count}
                      </span>
                    </span>
                    <span className="mb-6 block text-[0.9375rem] leading-[1.7] text-ink-700">
                      {doorway.body}
                    </span>
                    <span className="kicker mt-auto flex items-center gap-2 text-gold-ink">
                      Explore {doorway.label}
                      <ArrowRight
                        aria-hidden
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Section>

        {/* ── What we believe ────────────────────────────────────── */}
        <Section>
          <SectionHead
            id="faith"
            eyebrow="What We Believe"
            title="Grounded in the Scriptures, centred on Jesus Christ"
            lede="Each article of faith is published with the Scriptures that support it and the teachings that expand on it, rather than as a document to download."
          />

          <ul className="grid gap-5 md:grid-cols-2">
            {faithArticles.map((article) => (
              <li
                key={article.num}
                className="flex flex-col rounded-panel border border-rule bg-card p-7 sm:p-8"
              >
                <span className="tabular mb-4 block font-mono text-[0.6875rem] text-gold">
                  {article.num}
                </span>
                <span className="mb-3 block font-display text-[1.375rem] leading-[1.2] text-navy">
                  {article.title}
                </span>
                <span className="mb-6 block text-[0.9375rem] leading-[1.7] text-ink-700">
                  {article.body}
                </span>
                <span className="mt-auto block border-t border-rule-soft pt-4 font-mono text-[0.6875rem] leading-[1.6] text-ink-subtle">
                  {article.refs}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── Where we meet ──────────────────────────────────────── */}
        <Section>
          <SectionHead
            id="locations"
            eyebrow="Where We Meet"
            title="Across all forty-seven counties, and beyond Kenya"
            lede="The ministry is distributed globally — it preaches, holds conferences and gathers on every continent it has been invited to. Its home is Kenya, where it meets in all forty-seven counties."
          />

          <p className="mb-9 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-subtle">
            <span className="text-gold-ink">Head office</span>
            <span aria-hidden>·</span>
            <span>{pastoralCare.office.replace('Head office · ', '')}</span>
          </p>

          {/* A county whose altar is named opens that altar on the map. A
              county without one is still listed, because the ministry
              gathers there — it is only the location we cannot yet point
              at, and pointing at an unchecked pin is how a reader ends up
              somewhere else on a Sunday morning. */}
          <ul className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {counties.map((county) => {
              const chrome =
                'flex items-start gap-3 rounded-tile border p-4 transition-colors'
              const numeral = (
                <span aria-hidden className="tabular pt-0.5 font-mono text-[0.6875rem] text-gold">
                  {String(county.no).padStart(2, '0')}
                </span>
              )

              if (!county.altar) {
                return (
                  <li key={county.no} className={`${chrome} border-rule-soft bg-transparent`}>
                    {numeral}
                    <span className="block text-[0.9375rem] leading-[1.4] text-ink-500">
                      {county.name}
                    </span>
                  </li>
                )
              }

              return (
                <li key={county.no}>
                  <a
                    href={mapsHref(county.altar.maps)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`focus-ring group ${chrome} border-rule bg-card hover:border-gold/60`}
                  >
                    {numeral}
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[1.125rem] leading-[1.25] text-navy">
                        {county.name}
                      </span>
                      <span className="mt-1 block text-[0.8125rem] leading-[1.5] text-ink-700">
                        {county.altar.name}
                      </span>
                      {county.altar.where && (
                        <span className="mt-1 block text-[0.75rem] leading-[1.5] text-ink-subtle">
                          {county.altar.where}
                        </span>
                      )}
                      <span className="kicker mt-2.5 flex items-center gap-1.5 text-gold-ink">
                        Open in Maps
                        <ArrowUpRight
                          aria-hidden
                          className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      </span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>

          <p className="mt-8 max-w-measure text-[0.9375rem] leading-[1.75] text-ink-subtle">
            A county listed without an altar is one the ministry gathers in, whose meeting place is
            not yet recorded here. We would rather say that than send someone to a pin nobody has
            checked. If you know the altar in your county, tell us its name and we will add it.
          </p>
        </Section>
      </div>
    </main>
  )
}
