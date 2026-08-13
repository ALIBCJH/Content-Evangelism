import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { siteInfo, siteUrl } from '@/lib/content'
import {
  teachingById,
  teachingHref,
  teachingRecordings,
  type TeachingRecording,
} from '@/lib/teachings'
import { rssAlternate } from '@/lib/seo'
import { embedSrc, posterSrc, watchHref } from '@/lib/youtube'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { RecordAside } from '@/components/record/record-aside'

/**
 * One recorded teaching.
 *
 * The page leads with the recording, because the recording *is* the
 * teaching — everything else on the page describes it. Under the player
 * is what the ministry stated about it and nothing it did not: the date
 * where there is a confirmed one, where it was preached, the series it
 * belongs to. Beside it, the other recordings and the way back into the
 * rest of the site.
 *
 * There is no transcript here yet, and the page says so rather than
 * padding the space. When one is written the teaching becomes an article
 * and joins search and the sitemap with it.
 */

export const revalidate = 300

interface Params {
  params: { id: string }
}

export function generateStaticParams() {
  return teachingRecordings.map((recording) => ({ id: recording.id }))
}

export function generateMetadata({ params }: Params): Metadata {
  const recording = teachingById(params.id)
  if (!recording) return { title: 'Teaching not found', robots: { index: false, follow: false } }

  const description =
    recording.summary ??
    `A recorded teaching from the ${siteInfo.ministry}, preached by ${siteInfo.head}.`

  return {
    title: recording.title,
    description,
    alternates: { canonical: teachingHref(recording), types: rssAlternate },
    openGraph: {
      type: 'video.other',
      title: recording.title,
      description,
      url: teachingHref(recording),
    },
  }
}

/** The stated facts, and only the stated ones. */
function statedRows(recording: TeachingRecording) {
  return [
    { k: 'Preached by', v: siteInfo.head },
    { k: 'Date', v: recording.date },
    ...(recording.place ? [{ k: 'Where', v: recording.place }] : []),
    ...(recording.series ? [{ k: 'Series', v: recording.series }] : []),
    ...(recording.scripture ? [{ k: 'Scripture', v: recording.scripture }] : []),
    { k: 'Published by', v: 'Repent & Prepare The Way' },
  ]
}

export default function TeachingRecordPage({ params }: Params) {
  const recording = teachingById(params.id)
  if (!recording) notFound()

  const others = teachingRecordings.filter((other) => other.id !== recording.id)
  const rows = statedRows(recording)

  return (
    <main>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          '@id': `${siteUrl}${teachingHref(recording)}#recording`,
          name: recording.title,
          ...(recording.summary ? { description: recording.summary } : {}),
          thumbnailUrl: posterSrc(recording.video),
          embedUrl: embedSrc(recording.video),
          publisher: { '@id': `${siteUrl}/#ministry` },
          inLanguage: 'en',
        }}
      />

      {/* ── The header ─────────────────────────────────────────────── */}
      <section className="bg-navy text-ground">
        <div className="shell pb-9 pt-7">
          <Breadcrumbs
            className="mb-7 text-navy-soft [&_a:hover]:text-gold-pale [&_span[aria-current]]:text-gold-pale"
            crumbs={[
              { name: 'Home', href: '/' },
              { name: 'Teachings', href: '/teachings' },
              { name: recording.series ?? 'Recording' },
            ]}
          />
          <h1 className="mb-4 max-w-[900px] text-balance font-display text-[2.25rem] font-medium leading-[1.04] tracking-[-0.02em] sm:text-[2.75rem] lg:text-[3.25rem]">
            {recording.title}
          </h1>
          <p className="font-mono text-xs tracking-[0.06em] text-gold-pale">
            {recording.date}
            {recording.place ? ` · ${recording.place.toUpperCase()}` : ''} · RECORDING
          </p>
        </div>
        <div className="gold-rule" />
      </section>

      <div className="shell grid gap-12 pb-24 pt-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-[72px]">
        <article>
          {/* The recording leads: it is the teaching, and the rest of the
              page is description of it. */}
          <div className="relative h-0 overflow-hidden rounded-figure border border-navy-rule bg-navy-deep pb-[56.25%]">
            <iframe
              src={embedSrc(recording.video)}
              title={recording.title}
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
          <p className="mt-3 text-xs text-ink-subtle">
            Published by the ministry on its own channel.{' '}
            <a
              href={watchHref(recording.video)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy underline-offset-2 hover:text-gold hover:underline"
            >
              Watch on YouTube
            </a>
            .
          </p>

          <h2
            id="about-this-teaching"
            className="mb-5 mt-12 scroll-mt-stick font-display text-[1.75rem] font-medium text-navy sm:text-[2.125rem]"
          >
            About this teaching
          </h2>

          {recording.summary && (
            <p className="mb-7 max-w-measure text-[1.0625rem] leading-[1.75] text-ink-900 sm:text-[1.125rem]">
              {recording.summary}
            </p>
          )}

          <dl className="rounded-panel border border-rule bg-card px-6 py-2 sm:px-8">
            {rows.map((row) => (
              <div
                key={row.k}
                className="flex justify-between gap-5 border-b border-rule-soft py-3.5 text-[0.9375rem] last:border-b-0"
              >
                <dt className="text-ink-muted">{row.k}</dt>
                <dd className="text-right font-mono text-[0.8125rem] text-navy">{row.v}</dd>
              </div>
            ))}
          </dl>

          {recording.date === 'DATE TO CONFIRM' && (
            <p className="mt-4 text-[0.8125rem] leading-[1.7] text-ink-muted">
              The publication date of this recording has not yet been checked
              against the source, so none is stated. It is left open rather than
              guessed.
            </p>
          )}

          <h2
            id="transcript"
            className="mb-5 mt-14 scroll-mt-stick font-display text-[1.75rem] font-medium text-navy sm:text-[2.125rem]"
          >
            Transcript
          </h2>
          <p className="max-w-measure text-[1.0625rem] leading-[1.75] text-ink-900 sm:text-[1.125rem]">
            None has been set down for this teaching yet. When one is supplied it
            is published here as it was preached, rather than summarised — and the
            teaching joins the archive and search with it.
          </p>
        </article>

        <RecordAside
          heading="More teachings"
          items={others.map((other) => ({
            href: teachingHref(other),
            date: other.date,
            title: other.title,
          }))}
          links={[
            { href: '/teachings', label: 'ALL TEACHINGS' },
            { href: '/prophecies', label: 'PROPHECY ARCHIVE' },
            { href: '/articles', label: 'THE ARTICLES' },
          ]}
          contents={[
            ['About this teaching', 'about-this-teaching'],
            ['Transcript', 'transcript'],
          ]}
        />
      </div>
    </main>
  )
}
