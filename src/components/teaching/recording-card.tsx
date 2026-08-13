import * as React from 'react'
import Image from 'next/image'
import type { TeachingRecording } from '@/lib/teachings'
import { posterSrc, watchHref } from '@/lib/youtube'

/**
 * One recorded teaching, set as a card on the dated rail — the same
 * language the prophecy archive uses, because it is the same kind of
 * thing: a recording the ministry published, held with its own dateline.
 *
 * It opens YouTube rather than a page of its own. The ministry publishes
 * these on its channel and the site does not hold a transcript, so a
 * record page here would be a frame around a link and nothing else. The
 * card says so plainly — the whole card is the outbound link, and it is
 * marked as leaving the site.
 */
export function RecordingCard({ recording }: { recording: TeachingRecording }) {
  const meta = [recording.series, recording.place, recording.scripture].filter(Boolean)

  return (
    <a
      href={watchHref(recording.video)}
      target="_blank"
      rel="noopener noreferrer"
      className="card card-interactive group my-3 flex flex-col items-start gap-6 p-5 sm:ml-8 sm:p-8 lg:flex-row lg:gap-7"
    >
      <span className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden rounded-tile border border-rule bg-navy-deep lg:w-[260px]">
        <Image
          src={posterSrc(recording.video)}
          alt=""
          fill
          sizes="(min-width: 1024px) 260px, 100vw"
          className="object-cover"
        />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 flex h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-navy/80"
        >
          <svg width="13" height="16" viewBox="0 0 20 24" fill="#F7F4EC">
            <path d="M2 2l16 10L2 22z" />
          </svg>
        </span>
      </span>

      <span className="block min-w-0 flex-1">
        <span className="mb-3.5 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[0.6875rem] tracking-[0.08em] text-navy">
            {recording.date}
          </span>
          <span className="kicker rounded-chip border border-gold-pale/70 px-2.5 py-1 text-gold">
            Recording
          </span>
        </span>

        <span className="mb-3.5 block text-balance font-display text-[1.375rem] font-medium leading-[1.15] text-navy sm:text-[1.75rem]">
          {recording.title}
        </span>

        {recording.summary && (
          <span className="mb-4 block max-w-[720px] text-[0.9375rem] leading-[1.7] text-ink-muted">
            {recording.summary}
          </span>
        )}

        <span className="flex flex-wrap items-center justify-between gap-4 border-t border-rule-soft pt-4">
          <span className="flex flex-wrap gap-2">
            {meta.map((item) => (
              <span key={item} className="rounded-chip bg-chip px-3 py-1.5 text-xs text-ink-700">
                {item}
              </span>
            ))}
          </span>
          <span className="whitespace-nowrap font-mono text-[0.6875rem] text-navy transition-colors group-hover:text-gold">
            WATCH ON YOUTUBE ↗
          </span>
        </span>
      </span>
    </a>
  )
}
