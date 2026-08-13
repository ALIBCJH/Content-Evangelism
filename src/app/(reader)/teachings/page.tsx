import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CATEGORIES, articleSubjects, categoryBlurb, siteInfo, siteUrl, topicHref } from '@/lib/content'
import { listRealRows } from '@/lib/rows'
import { rssAlternate } from '@/lib/seo'
import { teachingRecordings } from '@/lib/teachings'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { DatedRail, DatedRailItem } from '@/components/archive/dated-rail'
import { RecordingCard } from '@/components/teaching/recording-card'
import { JsonLd } from '@/components/json-ld'

/**
 * The teaching library, arranged by subject rather than by date.
 *
 * The archive answers "what was published"; this page answers "what is
 * taught". Sections that actually hold something link to their own page;
 * the subjects beneath them hand off to search, which is the honest thing
 * to do until a subject has a pillar page of its own.
 */

export const metadata: Metadata = {
  title: 'Teachings',
  description:
    'The teaching library of the Ministry of Repentance and Holiness, arranged by subject — repentance, holiness, the rapture, the second coming, and the preparation of the Church.',
  alternates: { canonical: '/teachings', types: rssAlternate },
}

export const revalidate = 300

export default async function TeachingsPage() {
  const rows = await listRealRows()
  const sections = CATEGORIES.map((category) => ({
    category,
    count: rows.filter((row) => row.category === category).length,
  })).filter(({ count }) => count > 0)

  return (
    <main>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `${siteUrl}/teachings`,
          url: `${siteUrl}/teachings`,
          name: 'Teachings',
          description:
            'The teaching library of the Ministry of Repentance and Holiness, arranged by subject.',
          isPartOf: { '@id': `${siteUrl}/#website` },
          inLanguage: 'en',
        }}
      />

      <section className="border-b border-rule bg-raised">
        <div className="shell pb-14 pt-11">
          <Breadcrumbs
            className="mb-6"
            crumbs={[{ name: 'Home', href: '/' }, { name: 'Teachings' }]}
          />
          <h1 className="mb-4 font-display text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-navy sm:text-[3.625rem]">
            Teachings
          </h1>
          <p className="max-w-[660px] text-[1.0625rem] leading-[1.7] text-ink-700">
            The Scriptures opened for the Church, arranged by what they are about.
            Every teaching is filed under a section and carries the passages it rests
            on.
          </p>
        </div>
      </section>

      <div className="shell pb-24 pt-14">
        {/* The recordings first: they are teachings, where the two lists
            below them are ways of finding written pieces. The rail and the
            card are the archive's, because a published recording held with
            its dateline is what the prophecy archive already is. */}
        <h2 className="rule-heading mb-2 font-display text-[0.9375rem] font-medium uppercase tracking-[0.12em] text-navy">
          Recorded teachings
        </h2>
        <p className="mb-7 max-w-[660px] text-[0.9375rem] leading-[1.7] text-ink-muted">
          Published by the ministry on its own channel and preached by{' '}
          {siteInfo.head}. Each opens the recording on YouTube. A dateline
          reading “date to confirm” has not yet been checked against the
          source, and is left unstated rather than guessed.
        </p>

        <DatedRail>
          {teachingRecordings.map((recording, index) => {
            const previous = teachingRecordings[index - 1]
            const first = recording.year !== null && previous?.year !== recording.year
            return (
              <DatedRailItem key={recording.id} year={first ? recording.year : null}>
                <RecordingCard recording={recording} />
              </DatedRailItem>
            )
          })}
        </DatedRail>

        <div className="mb-16" />

        {sections.length > 0 && (
          <>
            <h2 className="rule-heading mb-7 font-display text-[0.9375rem] font-medium uppercase tracking-[0.12em] text-navy">
              Sections
            </h2>
            <ul className="mb-16 grid gap-5 md:grid-cols-2">
              {sections.map(({ category, count }) => (
                <li key={category}>
                  <Link
                    href={topicHref(category)}
                    className="card card-interactive flex h-full flex-col p-6 sm:p-8"
                  >
                    <span className="kicker mb-3.5 text-gold">
                      {count} {count === 1 ? 'piece' : 'pieces'}
                    </span>
                    <span className="mb-3 block font-display text-[1.625rem] font-medium leading-[1.15] text-navy">
                      {category}
                    </span>
                    <span className="mb-5 block flex-1 text-[0.9375rem] leading-[1.75] text-ink-700">
                      {categoryBlurb[category]}
                    </span>
                    <span className="block border-t border-rule-soft pt-4 font-mono text-[0.6875rem] text-navy">
                      READ THE SECTION →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="rule-heading mb-7 font-display text-[0.9375rem] font-medium uppercase tracking-[0.12em] text-navy">
          Subjects
        </h2>
        <ul className="flex flex-wrap gap-2.5">
          {articleSubjects.map((subject) => (
            <li key={subject}>
              <Link
                href={`/search?q=${encodeURIComponent(subject)}`}
                className="focus-ring inline-block rounded-chip border border-rule bg-card px-4 py-2.5 text-[0.875rem] text-ink-700 transition-colors hover:border-gold hover:text-navy"
              >
                {subject}
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 border-t border-rule pt-8 text-[0.9375rem] leading-[1.75] text-ink-muted">
          A subject opens the archive filtered to it. Once a subject has enough
          filed under it to carry a page of its own — the studies, the Scriptures,
          and the questions readers ask about it — that page takes its place here.
        </p>
      </div>
    </main>
  )
}
