import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { siteInfo, siteUrl } from '@/lib/content'
import {
  teachingById,
  teachingHref,
  teachingRecordings,
  type TeachingRecording,
} from '@/lib/teachings'
import { rssAlternate } from '@/lib/seo'
import { embedSrc, posterSrc, watchHref } from '@/lib/youtube'
import { JsonLd } from '@/components/json-ld'
import { buttonVariants } from '@/components/ui/button'
import { RecordAside } from '@/components/record/record-aside'
import { RecordFrame } from '@/components/record/record-frame'
import { RecordDescription } from '@/components/record/record-description'
import { AskQuestion } from '@/components/ask-question'

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
            { '@type': 'ListItem', position: 3, name: recording.title },
          ],
        }}
      />

      {/* The way back, at the head of the recording — the same door the
          prophecy record gives, because the two are the same kind of page
          and a reader should not have to learn each of them separately. */}
      <div className="shell pt-8">
        <Link
          href="/teachings"
          className={buttonVariants({ variant: 'outline', className: 'gap-2.5 px-7' })}
        >
          <ArrowLeft aria-hidden />
          All teachings
        </Link>
      </div>

      {/* Two columns, two rows: the recording runs the full height of the
          left column and the rail begins with the teaching's own title, so
          the reader meets the name of the thing beside the thing itself.
          Below the column break the rail stacks first, which puts the
          title back over the video. */}
      <div className="shell grid gap-x-12 gap-y-9 pb-24 pt-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr] lg:gap-x-[72px] lg:gap-y-10 lg:pt-10">
        <header className="lg:col-start-2 lg:row-start-1">
          <h1 className="mb-3.5 text-balance font-display text-[2rem] font-medium leading-[1.06] tracking-[-0.02em] text-navy sm:text-[2.5rem] lg:text-[1.9375rem] lg:leading-[1.1]">
            {recording.title}
          </h1>
          <p className="font-mono text-[0.6875rem] tracking-[0.06em] text-gold-ink">
            {recording.date}
            {recording.place ? ` · ${recording.place.toUpperCase()}` : ''} · RECORDING
          </p>
        </header>

        <article className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
          {/* The recording leads: it is the teaching, and the rest of the
              page is description of it. */}
          <RecordFrame
            kicker="Recording"
            note="Published by the ministry on its own channel."
            action={
              <a
                href={watchHref(recording.video)}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring rounded-chip border border-gold-pale/60 px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-gold-sand transition-colors hover:border-gold hover:text-plate-pale"
              >
                YouTube ↗
              </a>
            }
          >
            <iframe
              src={embedSrc(recording.video)}
              title={recording.title}
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
            />
          </RecordFrame>

          {/* The recording, described the way a recording is described
              anywhere else: a shaded panel under the player, holding the
              dateline and the first lines of the summary, and unfolding
              into what was stated and the transcript when asked. The
              prophecy record uses the same panel, so the two kinds of
              record are read the same way. */}
          <h2 id="about-this-teaching" className="sr-only">
            About this teaching
          </h2>
          <RecordDescription
            dateline={`${recording.date}${
              recording.place ? ` · ${recording.place.toUpperCase()}` : ''
            } · RECORDING`}
            summary={
              recording.summary ??
              `A recording published by the ministry on its own channel${
                recording.place ? `, preached at ${recording.place}` : ''
              }. What is stated about it is set out below; nothing that has not been checked against the source is stated at all.`
            }
            meta={rows}
          >
            {recording.date === 'DATE TO CONFIRM' && (
              <p className="mt-5 text-[0.8125rem] leading-[1.7] text-ink-muted">
                The publication date of this recording has not yet been checked
                against the source, so none is stated. It is left open rather
                than guessed.
              </p>
            )}

            <h3 className="kicker mt-8 text-ink-subtle">Transcript</h3>
            <p className="mt-2.5 border-t border-rule-soft pt-4 text-[0.9375rem] leading-[1.7] text-ink-muted">
              None has been set down for this teaching yet. When one is supplied
              it is published here as it was preached, rather than summarised —
              and the teaching joins the archive and search with it.
            </p>
          </RecordDescription>
        </article>

        <RecordAside
          className="lg:col-start-2 lg:row-start-2"
          links={[
            { href: '/teachings', label: 'ALL TEACHINGS' },
            { href: '/prophecies', label: 'PROPHECY ARCHIVE' },
            { href: '/articles', label: 'THE ARTICLES' },
          ]}
          contents={[]}
        />
      </div>

      <AskQuestion title={recording.title} subject="this teaching" />
    </main>
  )
}
