import * as React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { siteInfo, siteUrl } from '@/lib/content'
import { embedSrc, prophecyRecords, recordById, recordHref } from '@/lib/prophecies'
import { rssAlternate } from '@/lib/seo'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { FulfilledBadge } from '@/components/prophecy/fulfilled-badge'
import { RecordAside } from '@/components/record/record-aside'

/**
 * One prophecy record.
 *
 * The page is built around a single rule, which is the reason the archive
 * exists in this shape at all: what was published is labelled as what it
 * is. The recording carries a *Primary Source* pill, and everything below
 * it — the summary, the published details, the timeline — is drawn from
 * that recording and dated as published.
 *
 * A reader can therefore take the record apart: watch what was published,
 * see when it was published, and follow the dates that followed, without
 * the ministry's reading of the message being folded into the record of it.
 *
 * The title sits in the rail rather than over the page. A record is the
 * recording; the name of it is a label for the recording, and it reads as
 * one beside the video instead of as a headline above it.
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
function Provenance({ label, note }: { label: string; note: string }) {
  return (
    <p className="mb-4 flex flex-wrap items-center gap-3">
      <span className="kicker shrink-0 whitespace-nowrap rounded-chip bg-chip-gold px-3 py-1.5 text-gold-ink">
        {label}
      </span>
      <span className="text-[0.8125rem] text-ink-muted">{note}</span>
    </p>
  )
}

export default function RecordPage({ params }: Params) {
  const record = recordById(params.id)
  if (!record) notFound()

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

      {/* ── The band above the record: the way back, and nothing else ── */}
      <section className="bg-plate text-plate-pale">
        <div className="shell py-5">
          <Breadcrumbs
            className="text-navy-soft [&_a:hover]:text-gold-pale [&_span[aria-current]]:text-gold-pale"
            crumbs={[
              { name: 'Home', href: '/' },
              { name: 'Prophecy Archive', href: '/prophecies' },
              { name: `${record.location} · ${record.subject}` },
            ]}
          />
        </div>
        <div className="gold-rule" />
      </section>

      {/* Two columns, two rows: the recording runs the full height of the
          left column, and the rail begins with the record's own title —
          so the reader meets the name of the thing beside the thing
          itself rather than above it. Below the column break the rail
          stacks first, which puts the title back over the video. */}
      <div className="shell grid gap-x-12 gap-y-9 pb-24 pt-9 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr] lg:gap-x-[72px] lg:gap-y-10 lg:pt-12">
        <header className="lg:col-start-2 lg:row-start-1">
          <h1 className="mb-3.5 text-balance font-display text-[2rem] font-medium leading-[1.06] tracking-[-0.02em] text-navy sm:text-[2.5rem] lg:text-[1.9375rem] lg:leading-[1.1]">
            {record.title}
          </h1>
          <p className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
            <span className="font-mono text-[0.6875rem] tracking-[0.06em] text-gold-ink">
              {record.date} · {record.location.toUpperCase()} · VIDEO RECORD
            </span>
            {record.fulfilled && <FulfilledBadge />}
          </p>
        </header>

        <article className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
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
            note={
              record.published === 'To confirm'
                ? 'Official ministry recording. Publication date to confirm against the source.'
                : `Official ministry recording, published ${record.date}.`
            }
          />
          <p className="-mt-1 text-xs text-ink-subtle">
            The video is the primary source of this page; everything below is
            drawn from it.
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
        </article>

        <RecordAside
          className="lg:col-start-2 lg:row-start-2"
          links={[
            { href: '/prophecies', label: 'PROPHECY ARCHIVE' },
            { href: '/teachings', label: 'THE TEACHINGS' },
            { href: '/articles', label: 'THE ARTICLES' },
          ]}
          contents={[
            ['When it happened', 'when-it-happened'],
            ['Timeline', 'timeline'],
          ]}
        />
      </div>
    </main>
  )
}
