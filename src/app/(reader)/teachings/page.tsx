import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CATEGORIES,
  articleSubjects,
  categoryBlurb,
  siteInfo,
  siteUrl,
  topicHref,
} from '@/lib/content'
import { listRealRows } from '@/lib/rows'
import { rssAlternate } from '@/lib/seo'
import { teachingHref, teachingRecordings } from '@/lib/teachings'
import { RecordingList } from '@/components/teaching/recording-list'
import { JsonLd } from '@/components/json-ld'

/**
 * The teaching library, arranged by subject rather than by date.
 *
 * The archive answers "what was published"; this page answers "what is
 * taught". It holds two kinds of thing and says so: the recordings, which
 * are the teaching as it was preached, and under them a way into the
 * written archive by subject. Sections that actually hold something link
 * to their own page; the subjects beneath them hand off to search, which
 * is the honest thing to do until a subject has a pillar page of its own.
 */

export const metadata: Metadata = {
  title: 'Teachings',
  description:
    'Recorded teachings of the Ministry of Repentance and Holiness, preached by Prophet Dr. David Owuor — conferences, live teachings and short messages, each with its date and runtime — and the written archive by subject.',
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
          /* What is actually on the shelf, in the order it is shown.
             Each recording's own page carries the VideoObject with its
             runtime and upload date; this only says the shelf holds
             them, and in what order. */
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: teachingRecordings.length,
            itemListElement: teachingRecordings.map((recording, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `${siteUrl}${teachingHref(recording)}`,
              name: recording.title,
            })),
          },
        }}
      />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Teachings',
              item: `${siteUrl}/teachings`,
            },
          ],
        }}
      />

      {/* The recordings open the page: they are teachings, where the two
          lists below them are ways of finding written pieces. The rail and
          the card are the archive's, because a published recording held
          with its dateline is what the prophecy archive already is.

          The band comes with them rather than standing above on its own,
          because the box in it filters the rail underneath — both belong
          to the one component that knows what a reader typed. */}
      <RecordingList
        recordings={teachingRecordings}
        header={
          <div>
            <h1 className="font-display text-[1.75rem] font-medium leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.375rem]">
              Teachings
            </h1>
            {/* Who this is and how much of it there is. Most people who
                reach this page arrive from a search result and have never
                heard of the ministry; a heading on its own tells them
                nothing about what they have found. */}
            <p className="mt-1.5 text-[0.9375rem] leading-[1.6] text-ink-700">
              {teachingRecordings.length} recordings preached by {siteInfo.head},
              published by the ministry on its own channel.
            </p>
          </div>
        }
      />

      {/* Everything above this line is recordings; everything below it is
          a way into the written archive. They are two different kinds of
          thing under one heading, and the page used to slide from one to
          the other with nothing to mark the change — a reader scrolling
          past the last sermon simply found themselves somewhere else. The
          band and the heading are the seam, said out loud. */}
      <section className="border-y border-rule bg-raised">
        <div className="shell py-9">
          <h2 className="font-display text-[1.375rem] font-medium leading-[1.15] text-navy sm:text-[1.625rem]">
            Written teaching, by subject
          </h2>
          <p className="mt-2 max-w-[62ch] text-[0.9375rem] leading-[1.7] text-ink-700">
            The recordings above are preached. What follows is the written
            archive, arranged by what it is about.
          </p>
        </div>
      </section>

      <div className="shell pb-24 pt-14">
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
