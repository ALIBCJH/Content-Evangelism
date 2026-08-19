import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { siteInfo, siteUrl } from '@/lib/content'
import { embedSrc, prophecyRecords, recordById, recordHref } from '@/lib/prophecies'
import { rssAlternate } from '@/lib/seo'
import { JsonLd } from '@/components/json-ld'
import { buttonVariants } from '@/components/ui/button'
import { FulfilledBadge } from '@/components/prophecy/fulfilled-badge'
import { RecordAside } from '@/components/record/record-aside'
import { RecordDescription } from '@/components/record/record-description'
import { AskQuestion } from '@/components/ask-question'

/**
 * One prophecy record.
 *
 * The page is built around a single rule, which is the reason the archive
 * exists in this shape at all: what was published is labelled as what it
 * is. The recording carries a *Primary Source* pill, and the description
 * panel under it — the summary, the published details, the timeline — is
 * drawn from that recording and dated as published.
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

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Prophecy Archive',
              item: `${siteUrl}/prophecies`,
            },
            { '@type': 'ListItem', position: 3, name: record.title },
          ],
        }}
      />

      {/* The way back, at the head of the record. A trail of crumbs read as
          ornament above a page that is mostly a video; the button says the
          one thing a reader leaving this record wants said. */}
      <div className="shell pt-8">
        <Link
          href="/prophecies"
          className={buttonVariants({ variant: 'outline', className: 'gap-2.5 px-7' })}
        >
          <ArrowLeft aria-hidden />
          All prophecies
        </Link>
      </div>

      {/* Two columns, two rows: the recording runs the full height of the
          left column, and the rail begins with the record's own title —
          so the reader meets the name of the thing beside the thing
          itself rather than above it. Below the column break the rail
          stacks first, which puts the title back over the video. */}
      <div className="shell grid gap-x-12 gap-y-9 pb-24 pt-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr] lg:gap-x-[72px] lg:gap-y-10 lg:pt-10">
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

          {/* The record, described the way a video is described: a shaded
              panel under the player that opens with the dateline and the
              first lines of the summary, and unfolds into the published
              details and the timeline when a reader asks for them. */}
          <h2 id="when-it-happened" className="sr-only">
            When it happened
          </h2>
          <RecordDescription
            dateline={`${record.date} · ${record.location.toUpperCase()} · ${record.subject.toUpperCase()}`}
            summary={record.summary}
            meta={meta}
            timeline={record.timeline}
          />
        </article>

        <RecordAside
          className="lg:col-start-2 lg:row-start-2"
          links={[
            { href: '/prophecies', label: 'PROPHECY ARCHIVE' },
            { href: '/teachings', label: 'THE TEACHINGS' },
            { href: '/articles', label: 'THE ARTICLES' },
          ]}
          contents={[]}
        />
      </div>

      <AskQuestion title={record.title} subject="this record" />
    </main>
  )
}
