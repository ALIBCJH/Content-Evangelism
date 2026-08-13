import * as React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { siteInfo, siteUrl } from '@/lib/content'
import {
  embedSrc,
  prophecyRecords,
  recordById,
  recordHref,
} from '@/lib/prophecies'
import { rssAlternate } from '@/lib/seo'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { FulfilledBadge } from '@/components/prophecy/fulfilled-badge'
import { RecordAside } from '@/components/record/record-aside'

/**
 * One prophecy record.
 *
 * The page is built around a single rule, which is the reason the archive
 * exists in this shape at all: the *source*, the *event*, and the
 * *interpretation* are three different kinds of claim, and each is
 * labelled as what it is.
 *
 *   Primary Source     — the ministry's own recording, embedded whole.
 *   Independent Record — published by somebody other than the ministry.
 *   Interpretation     — how the ministry reads the message.
 *
 * A reader can therefore take the record apart: watch what was published
 * and when, read what independent bodies recorded afterwards, and see the
 * ministry's reading of it — without any of the three being mistaken for
 * either of the others.
 */

export const revalidate = 300

interface Params {
  params: { id: string }
}

export function generateStaticParams() {
  return prophecyRecords.map((record) => ({ id: record.id }))
}

export function generateMetadata({ params }: Params): Metadata {
  const record = recordById(params.id)
  if (!record) return { title: 'Record not found', robots: { index: false, follow: false } }

  return {
    title: record.title,
    description: record.summary,
    keywords: [record.location, record.subject, 'prophecy', siteInfo.ministry],
    alternates: { canonical: recordHref(record), types: rssAlternate },
    openGraph: {
      type: 'article',
      title: record.title,
      description: record.summary,
      url: recordHref(record),
      ...(record.published !== 'To confirm' ? { publishedTime: record.published } : {}),
    },
  }
}

/** A labelled provenance pill — the one piece of chrome this page insists on. */
function Provenance({
  label,
  tone,
  note,
}: {
  label: string
  tone: 'source' | 'independent'
  note: string
}) {
  return (
    <p className="mb-4 flex flex-wrap items-center gap-3">
      <span
        className={`kicker shrink-0 whitespace-nowrap rounded-chip px-3 py-1.5 ${
          tone === 'source'
            ? 'bg-chip-gold text-gold-ink'
            : 'border border-[#C9D8E8] bg-[#E1E9F3] text-navy'
        }`}
      >
        {label}
      </span>
      <span className="text-[0.8125rem] text-ink-muted">{note}</span>
    </p>
  )
}

export default function RecordPage({ params }: Params) {
  const record = recordById(params.id)
  if (!record) notFound()

  const others = prophecyRecords.filter((other) => other.id !== record.id)
  const meta = [
    { k: 'Prophet', v: siteInfo.head },
    { k: 'Date published', v: record.published },
    { k: 'Location', v: record.location },
    { k: 'Subject', v: record.subject },
    { k: 'Record ID', v: record.rid },
  ]

  return (
    <main>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          '@id': `${siteUrl}${recordHref(record)}#record`,
          name: record.title,
          description: record.summary,
          thumbnailUrl: `https://i.ytimg.com/vi/${record.video}/hqdefault.jpg`,
          embedUrl: embedSrc(record.video),
          ...(record.published !== 'To confirm' ? { uploadDate: record.published } : {}),
          publisher: { '@id': `${siteUrl}/#ministry` },
          inLanguage: 'en',
          contentLocation: { '@type': 'Place', name: record.location },
        }}
      />

      {/* ── The header ─────────────────────────────────────────────── */}
      <section className="bg-navy text-ground">
        <div className="shell pb-9 pt-7">
          <Breadcrumbs
            className="mb-8 text-navy-soft [&_a:hover]:text-gold-pale [&_span[aria-current]]:text-gold-pale"
            crumbs={[
              { name: 'Home', href: '/' },
              { name: 'Prophecy Archive', href: '/prophecies' },
              { name: `${record.location} · ${record.subject}` },
            ]}
          />

          <h1 className="mb-4 max-w-[900px] text-balance font-display text-[2.25rem] font-medium leading-[1.04] tracking-[-0.02em] sm:text-[2.75rem] lg:text-[3.25rem]">
            {record.title}
          </h1>
          <p className="flex flex-wrap items-center gap-3.5">
            <span className="font-mono text-xs tracking-[0.06em] text-gold-pale">
              {record.date} · {record.location.toUpperCase()} · VIDEO RECORD
            </span>
            {record.fulfilled && <FulfilledBadge tone="navy" />}
          </p>
        </div>
        <div className="gold-rule" />
      </section>

      <div className="shell grid gap-12 pb-24 pt-16 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-[72px]">
        <article>
          {/* ── The source ───────────────────────────────────────── */}
          <h2 id="original-source" className="sr-only">
            Original source
          </h2>
          <div className="relative h-0 overflow-hidden rounded-figure border border-navy-rule bg-navy-deep pb-[56.25%]">
            <iframe
              src={embedSrc(record.video)}
              title={`Original recording — ${record.title}`}
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
          <Provenance
            label="Primary Source"
            tone="source"
            note={
              record.published === 'To confirm'
                ? 'Official ministry recording. Publication date to confirm against the source.'
                : `Official ministry recording, published ${record.date}.`
            }
          />
          <p className="-mt-1 text-xs text-ink-subtle">
            The video is the primary source of this page; every excerpt below is
            transcribed from it.
          </p>

          {/* When it happened, as published — under the recording it
              describes rather than beside the title, where it was
              competing with the headline for the same glance. */}
          <h2
            id="when-it-happened"
            className="mb-5 mt-12 scroll-mt-stick font-display text-[1.75rem] font-medium text-navy sm:text-[2.125rem]"
          >
            When it happened
          </h2>
          <p className="mb-7 max-w-measure text-[1.0625rem] leading-[1.75] text-ink-900 sm:text-[1.125rem]">
            {record.summary}
          </p>
          <dl className="rounded-panel border border-rule bg-card px-6 py-2 sm:px-8">
            {meta.map((row) => (
              <div
                key={row.k}
                className="flex justify-between gap-5 border-b border-rule-soft py-3.5 text-[0.9375rem] last:border-b-0"
              >
                <dt className="text-ink-muted">{row.k}</dt>
                <dd className="text-right font-mono text-[0.8125rem] text-navy">{row.v}</dd>
              </div>
            ))}
          </dl>

          {/* ── What was said ────────────────────────────────────── */}
          <h2
            id="what-was-said"
            className="mb-5 mt-14 scroll-mt-stick font-display text-[1.75rem] font-medium text-navy sm:text-[2.125rem]"
          >
            What Was Said
          </h2>
          <p className="max-w-measure text-[1.0625rem] leading-[1.75] text-ink-900 sm:text-[1.125rem]">
            Excerpts are transcribed from the original recording in the order they
            were spoken, with timestamps, and nothing added or removed. None have
            been set down for this record yet — when the transcript is supplied it
            is published here verbatim rather than summarised.
          </p>

          {/* ── The timeline ─────────────────────────────────────── */}
          <h2
            id="timeline"
            className="mb-2 mt-14 scroll-mt-stick font-display text-[1.75rem] font-medium text-navy sm:text-[2.125rem]"
          >
            Timeline
          </h2>
          <p className="mb-7 text-[0.9375rem] text-ink-muted">
            Dates as published. Each entry names its own source.
          </p>
          <ol className="rounded-panel border border-rule bg-card px-6 py-2 sm:px-8">
            {record.timeline.map((event) => (
              <li
                key={`${event.date}-${event.title}`}
                className="grid gap-3 border-b border-rule-soft py-6 last:border-b-0 sm:grid-cols-[90px_1fr] sm:gap-7"
              >
                <span className="pt-0.5 font-mono text-xs tracking-[0.06em] text-gold">
                  {event.date}
                </span>
                <span className="block">
                  <span className="mb-1.5 block font-display text-[1.25rem] text-navy">
                    {event.title}
                  </span>
                  <span className="block text-sm leading-[1.65] text-ink-muted">
                    {event.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          {/* ── What followed, from other people ─────────────────── */}
          <h2
            id="subsequent-events"
            className="mb-5 mt-14 scroll-mt-stick font-display text-[1.75rem] font-medium text-navy sm:text-[2.125rem]"
          >
            Subsequent Events
          </h2>
          <div className="rounded-panel border border-[#DCE4EE] bg-[#F3F6FA] p-6 sm:p-8">
            <Provenance
              label="Independent Record"
              tone="independent"
              note="Not produced by the ministry"
            />
            {record.independent.length > 0 ? (
              <ul>
                {record.independent.map((source) => (
                  <li
                    key={source.org}
                    className="grid gap-4 border-t border-[#DCE4EE] py-4 sm:grid-cols-[150px_1fr_auto] sm:gap-6"
                  >
                    <span className="font-mono text-xs text-navy">{source.org}</span>
                    <span className="text-[0.9375rem] leading-[1.6] text-ink-900">
                      {source.detail}
                    </span>
                    {source.href && (
                      <a
                        href={source.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whitespace-nowrap font-mono text-[0.6875rem] text-navy hover:text-gold"
                      >
                        SOURCE →
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-[#DCE4EE] pb-1 pt-5 text-[0.9375rem] text-ink-muted">
                No independent records added yet.
              </p>
            )}
            <p className="mt-5 border-t border-[#DCE4EE] pt-4 text-[0.8125rem] leading-[1.7] text-ink-muted">
              This section presents the published record of what occurred, with its
              sources. Readers are left to draw their own conclusions; the ministry&rsquo;s
              understanding of the event is set out separately below.
            </p>
          </div>

          {/* ── How the ministry reads it ────────────────────────── */}
          <h2
            id="interpretation"
            className="mb-5 mt-14 scroll-mt-stick font-display text-[1.75rem] font-medium text-navy sm:text-[2.125rem]"
          >
            Interpretation
          </h2>
          <div className="rounded-panel border border-[#E8DEC2] bg-[#FBF7EC] p-6 sm:p-8">
            <p className="kicker mb-4 text-gold-ink">Ministry Interpretation</p>
            <p className="text-[1.0625rem] leading-[1.75] text-ink-900">
              How the ministry understands this message in the context of Scripture.
              Written and attributed separately from the record above, so that source,
              event, and interpretation are never read as one another.
            </p>
          </div>
        </article>

        <RecordAside
          heading="More prophecies"
          items={others.map((other) => ({
            href: recordHref(other),
            date: other.date,
            title: other.title,
          }))}
          links={[
            { href: '/prophecies', label: 'PROPHECY ARCHIVE' },
            { href: '/teachings', label: 'THE TEACHINGS' },
            { href: '/articles', label: 'THE ARTICLES' },
          ]}
          contents={[
            ['When it happened', 'when-it-happened'],
            ['What Was Said', 'what-was-said'],
            ['Timeline', 'timeline'],
            ['Subsequent Events', 'subsequent-events'],
            ['Interpretation', 'interpretation'],
          ]}
        />
      </div>
    </main>
  )
}
