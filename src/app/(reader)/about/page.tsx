import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CATEGORIES,
  aboutSections,
  categoryBlurb,
  faithArticles,
  foundingYear,
  locations,
  missionStatement,
  siteInfo,
  siteUrl,
  topicHref,
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
    'Who publishes this archive and what is in it. The Ministry of Repentance and Holiness — founded in Nairobi and led by Prophet Dr. David Owuor — calls the nations to repentance, righteousness and holiness in preparation for the coming of the Messiah. Its teachings, doctrine, prophetic record and editorial rules are set out here.',
  alternates: { canonical: '/about', types: rssAlternate },
}

export const revalidate = 300

/**
 * The rules the desk publishes under.
 *
 * Every one of them is already visible in the archive — the dates on the
 * teachings, the labelled panels inside them, the prophetic records held
 * with their publication dates, and the blocks that say a source is
 * missing rather than filling the gap. Writing them down here lets a
 * reader hold the site to them.
 */
const editorialRules = [
  {
    title: 'Dated, attributed, and left where it was written',
    body: 'Every teaching carries the day it was published and the desk that wrote it. Nothing is quietly back-dated, and an edited piece says when it was edited.',
  },
  {
    title: 'Scripture is quoted, not alluded to',
    body: 'A passage that carries an argument is set out in full, with book, chapter and verse, so a reader can check it against their own Bible rather than take our word for the sense of it.',
  },
  {
    title: "The ministry's teaching is labelled as the ministry's teaching",
    body: 'Where a page states what this ministry holds rather than what the text plainly says, it is marked as such. A reader is entitled to know which of the two they are reading.',
  },
  {
    title: 'Where Christians disagree, the page says so',
    body: 'On the rapture, the millennium, the gifts and much else, serious Christians read the same passages and reach different conclusions. The archive states its own position openly and does not pretend it is the only reading available.',
  },
  {
    title: 'Prophecy is kept with its record',
    body: 'A prophetic word is held with its original recording and the date it was published, separately from any later event — so that a source, an event, and an interpretation of that event are never read as one another.',
  },
  {
    title: 'Testimony is called testimony',
    body: 'An account of a healing is a first-hand report of what witnesses believe took place. It is published as that, and never dressed as an independently documented medical finding.',
  },
  {
    title: 'Prayer is never set against medicine',
    body: 'Scripture does not oppose the two, and assuming it does has cost people their health. Where a teaching touches illness, it says plainly: continue your treatment.',
  },
  {
    title: 'A missing source is admitted, not filled in',
    body: 'Where the ministry\u2019s own published wording is needed and has not been supplied, the page says so in the open rather than printing a paraphrase nobody can check.',
  },
]

export default async function AboutPage() {
  const rows = await listRealRows()

  /* What the archive actually holds, by subject. A section with nothing
     under it is not a section a reader should be sent to, so the list is
     counted from the archive rather than typed out — the same rule the
     stat row follows. */
  const subjects = CATEGORIES.map((category) => ({
    category,
    blurb: categoryBlurb[category],
    count: rows.filter((row) => row.category === category).length,
  })).filter((subject) => subject.count > 0)

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

          {/* items-start, not items-end: the description is long enough
              now that a bottom-aligned nav floats in the middle of the
              band with nothing above it. */}
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-[72px]">
            <div>
              <p className="kicker mb-4 text-gold">Who publishes here</p>
              <h1 className="mb-6 font-display text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-navy sm:text-[3.625rem]">
                About the Ministry
              </h1>

              {/* The lead is set larger than the paragraphs under it. A
                  reader who gets no further than this should still be able
                  to say who publishes here and what they are saying. */}
              <p className="mb-5 max-w-[46rem] text-pretty font-reading text-[1.25rem] leading-[1.6] text-ink-900 sm:text-[1.4375rem]">
                The Ministry of Repentance and Holiness is a Christian ministry
                founded in {foundingYear}, working from Nairobi and led by{' '}
                {siteInfo.head}. It exists to say one thing to the nations, and it has
                never varied it: the Messiah is coming, and the Church must be found
                ready when He arrives.
              </p>

              <p className="mb-5 max-w-[42rem] text-pretty text-[1.0625rem] leading-[1.75] text-ink-700 sm:text-[1.125rem]">
                That message is unfashionably direct, and this archive does not soften
                it. Repentance is a turning, not a feeling. Holiness is not an advanced
                course for the devout few — it is the condition Scripture sets on
                seeing God at all. And the return of Christ is not a figure of speech
                to be handled carefully; it is an appointment. Every teaching published
                here serves those three sentences.
              </p>

              <p className="max-w-[42rem] text-pretty text-[1.0625rem] leading-[1.75] text-ink-700 sm:text-[1.125rem]">
                What you will find is writing meant to be read rather than skimmed: the
                Scriptures opened at length, doctrine set out with the passages it
                rests on, the prophetic record held with its original recordings, and
                the plain admission — where it applies — that Christians who take the
                same Bible equally seriously have read a passage in more than one way.
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

          {/* ── What we publish ────────────────────────────────── */}
          <h2
            id="publishing"
            className="mb-6 scroll-mt-stick font-display text-[0.9375rem] font-medium uppercase tracking-[0.12em] text-navy"
          >
            What We Publish
          </h2>
          <p className="mb-7 max-w-measure text-[1.0625rem] leading-[1.8] text-ink-700">
            The archive is one body of writing filed under the subjects below. A
            subject appears here only once something is published under it, so this
            list is what the site holds today rather than what it hopes to hold.
          </p>
          <ul className="mb-14 grid gap-4 sm:grid-cols-2">
            {subjects.map(({ category, blurb, count }) => (
              <li key={category}>
                <Link
                  href={topicHref(category)}
                  className="focus-ring block h-full rounded-panel border border-rule bg-card p-6 transition-colors hover:border-gold/60"
                >
                  <span className="mb-2 flex items-baseline justify-between gap-4">
                    <span className="font-display text-[1.25rem] text-navy">{category}</span>
                    <span className="tabular font-mono text-[0.6875rem] text-gold">
                      {count}
                    </span>
                  </span>
                  <span className="block text-[0.9375rem] leading-[1.7] text-ink-700">
                    {blurb}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

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

          {/* ── How this archive is kept ───────────────────────── */}
          <h2
            id="editorial"
            className="mb-6 mt-14 scroll-mt-stick font-display text-[0.9375rem] font-medium uppercase tracking-[0.12em] text-navy"
          >
            How This Archive Is Kept
          </h2>
          <p className="mb-7 max-w-measure text-[1.0625rem] leading-[1.8] text-ink-700">
            A ministry that asks people to test what they are told owes them the means
            of testing it. These are the rules this desk publishes under, and they are
            the reason some pages here say less than a reader might expect.
          </p>
          <ol className="mb-9 overflow-hidden rounded-panel border border-rule bg-card">
            {editorialRules.map((rule, index) => (
              <li
                key={rule.title}
                className="grid grid-cols-[32px_minmax(0,1fr)] gap-5 border-b border-rule-soft px-6 py-5 last:border-b-0 sm:px-7"
              >
                <span className="tabular pt-1 font-mono text-xs text-gold">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="block">
                  <span className="mb-1.5 block font-display text-[1.25rem] leading-[1.25] text-navy">
                    {rule.title}
                  </span>
                  <span className="block text-[0.9375rem] leading-[1.7] text-ink-700">
                    {rule.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          {/* The design's own device: where the ministry's published
              wording is needed and has not been supplied, the page says so
              rather than paraphrasing something unsourced into print. */}
          <div className="rounded-figure border border-dashed border-source-rule bg-source-bg px-6 py-6">
            <p className="kicker-lg mb-3 text-source-label">
              [Source needed — do not publish as is]
            </p>
            <p className="text-[0.9375rem] leading-[1.75] text-source-ink">
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
                href="/"
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
