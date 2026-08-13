import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { TeachingRecording } from '@/lib/teachings'
import Link from 'next/link'
import { teachingHref } from '@/lib/teachings'
import { embedSrc, posterSrc, watchHref } from '@/lib/youtube'

/**
 * One recorded teaching, set as a card on the dated rail — the same
 * language the prophecy archive uses, because it is the same kind of
 * thing: a recording the ministry published, held with its own dateline.
 *
 * It plays here rather than sending the reader to YouTube. Until it is
 * asked to, though, there is no player on the page at all: the card shows
 * the poster frame and a button, and the iframe is mounted only on the
 * click. Seven embeds loaded eagerly would be several megabytes of player
 * before a reader has chosen anything, which on the mobile data most of
 * these readers are on is the difference between a page that opens and one
 * that does not.
 *
 * Playing expands the video to the full width of the card. A sermon in the
 * 260px thumbnail slot is not watchable, so the row layout gives way to a
 * stacked one for as long as the player is open.
 *
 * The player is the no-cookie host, as every embed on this site is, and
 * the link out to YouTube stays in the footer for a reader who would
 * rather watch it there.
 */
export function RecordingCard({
  recording,
  playing,
  onPlay,
}: {
  recording: TeachingRecording
  playing: boolean
  onPlay: () => void
}) {
  const meta = [recording.series, recording.place, recording.scripture].filter(Boolean)

  return (
    <div
      className={cn(
        'card my-3 flex flex-col items-start gap-6 p-5 sm:ml-8 sm:p-8',
        !playing && 'card-interactive lg:flex-row lg:gap-7'
      )}
    >
      <div
        className={cn(
          'relative w-full shrink-0 overflow-hidden rounded-tile border border-rule bg-navy-deep',
          playing ? 'aspect-video' : 'aspect-[16/9] lg:w-[260px]'
        )}
      >
        {playing ? (
          <iframe
            src={`${embedSrc(recording.video)}?autoplay=1&rel=0`}
            title={recording.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Play: ${recording.title}`}
            className="focus-ring group/play absolute inset-0 h-full w-full cursor-pointer"
          >
            <Image
              src={posterSrc(recording.video)}
              alt=""
              fill
              sizes="(min-width: 1024px) 260px, 100vw"
              className="object-cover"
            />
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 flex h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-navy/80 transition-colors group-hover/play:bg-navy"
            >
              <svg width="13" height="16" viewBox="0 0 20 24" fill="#F7F4EC">
                <path d="M2 2l16 10L2 22z" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <div className="block min-w-0 flex-1">
        <p className="mb-3.5 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[0.6875rem] tracking-[0.08em] text-navy">
            {recording.date}
          </span>
          <span className="kicker rounded-chip border border-gold-pale/70 px-2.5 py-1 text-gold">
            Recording
          </span>
        </p>

        {/* Two ways in, and they are different things: the poster plays
            the teaching where it stands, the headline opens its record. */}
        <h3 className="mb-3.5 text-balance font-display text-[1.375rem] font-medium leading-[1.15] text-navy sm:text-[1.75rem]">
          <Link href={teachingHref(recording)} className="focus-ring">
            <span className="headline-link">{recording.title}</span>
          </Link>
        </h3>

        {recording.summary && (
          <p className="mb-4 max-w-[720px] text-[0.9375rem] leading-[1.7] text-ink-muted">
            {recording.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule-soft pt-4">
          <span className="flex flex-wrap gap-2">
            {meta.map((item) => (
              <span key={item} className="rounded-chip bg-chip px-3 py-1.5 text-xs text-ink-700">
                {item}
              </span>
            ))}
          </span>
          <span className="flex flex-wrap items-center gap-4">
            {!playing && (
              <button
                type="button"
                onClick={onPlay}
                className="focus-ring whitespace-nowrap font-mono text-[0.6875rem] text-navy transition-colors hover:text-gold"
              >
                ▶ PLAY HERE
              </button>
            )}
            <Link
              href={teachingHref(recording)}
              className="focus-ring whitespace-nowrap font-mono text-[0.6875rem] text-navy transition-colors hover:text-gold"
            >
              THE RECORD →
            </Link>
            <a
              href={watchHref(recording.video)}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring whitespace-nowrap font-mono text-[0.6875rem] text-ink-subtle transition-colors hover:text-gold"
            >
              YOUTUBE ↗
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}
