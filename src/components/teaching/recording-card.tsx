import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  dateline,
  runtime,
  runtimeInWords,
  teachingHref,
  type TeachingRecording,
} from '@/lib/teachings'
import Link from 'next/link'
import { embedSrc, posterSrc } from '@/lib/youtube'

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
 * There are two ways in and they are two different things: the poster
 * plays the teaching where it stands, the headline opens its record.
 * There used to be a third — a "PLAY HERE" link beside them — which did
 * exactly what the poster above it already did, and a fourth out to
 * YouTube. Both are gone. The poster is the largest target on the card
 * and it is a play button; a second one in 11px type was not helping
 * anybody, and the way out to YouTube belongs on the record, where a
 * reader who wants the source goes looking for it.
 */
export function RecordingCard({
  recording,
  playing,
  onPlay,
  /** The newest teaching leads the shelf: poster over text, at full width. */
  lead = false,
}: {
  recording: TeachingRecording
  playing: boolean
  onPlay: () => void
  lead?: boolean
}) {
  /* One line of stated fact, in the order a reader wants it: when, then
     where, then which conference, then the passage. These were chips
     below a rule at the foot of the card — the most searchable facts
     about a sermon, in the last place anyone looks. */
  const meta = [recording.place, recording.series, recording.scripture].filter(Boolean) as string[]

  return (
    <div
      className={cn(
        'card my-3 flex flex-col items-start gap-6 p-5 sm:ml-8 sm:p-8',
        !playing && !lead && 'card-interactive lg:flex-row lg:gap-7',
        !playing && lead && 'card-interactive'
      )}
    >
      <div
        className={cn(
          'relative w-full shrink-0 overflow-hidden rounded-tile border border-rule bg-navy-deep',
          playing || lead ? 'aspect-video' : 'aspect-[16/9] lg:w-[260px]'
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
            data-track="play-teaching"
            className="focus-ring group/play absolute inset-0 h-full w-full cursor-pointer"
          >
            <Image
              src={posterSrc(recording.video)}
              alt=""
              fill
              priority={lead}
              sizes={lead ? '(min-width: 1024px) 1000px, 100vw' : '(min-width: 1024px) 260px, 100vw'}
              className="object-cover"
            />
            <span
              aria-hidden
              className={cn(
                'absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-plate-deep/80 transition-colors group-hover/play:bg-plate-deep',
                lead ? 'h-[68px] w-[68px]' : 'h-[46px] w-[46px]'
              )}
            >
              <svg
                width={lead ? 19 : 13}
                height={lead ? 23 : 16}
                viewBox="0 0 20 24"
                fill="#F7F4EC"
              >
                <path d="M2 2l16 10L2 22z" />
              </svg>
            </span>

            {/* How long this is, where every player on earth puts it.
                It is the first question a reader asks of a sermon and
                the page had no answer: it is what tells a four-hour
                conference apart from a six-minute message. */}
            <span
              aria-hidden
              className="absolute bottom-2 right-2 rounded-[4px] bg-black/80 px-1.5 py-0.5 font-mono text-[0.6875rem] leading-none tracking-[0.04em] text-white"
            >
              {runtime(recording.seconds)}
            </span>
          </button>
        )}
      </div>

      <div className="block min-w-0 flex-1">
        <p className="mb-3 font-mono text-[0.6875rem] leading-[1.6] tracking-[0.06em]">
          <span className="text-gold-ink">{dateline(recording)}</span>
          {meta.length > 0 && (
            <span className="text-ink-muted"> · {meta.join(' · ').toUpperCase()}</span>
          )}
          {/* The badge on the poster is drawn, not spoken. */}
          <span className="sr-only"> · {runtimeInWords(recording.seconds)} long</span>
        </p>

        <h3
          className={cn(
            'mb-3.5 text-balance font-display font-medium leading-[1.15] text-navy',
            lead
              ? 'text-[1.625rem] sm:text-[2.125rem]'
              : 'text-[1.375rem] sm:text-[1.75rem]'
          )}
        >
          <Link href={teachingHref(recording)} className="focus-ring">
            <span className="headline-link">{recording.title}</span>
          </Link>
        </h3>

        {/* Set like the deks on the archive front: the reading serif,
            in the heavier ink the listing was moved to. A summary in
            light grey is the thing a reader's eye skips, and this one is
            the whole reason the card is worth stopping at. */}
        <p
          className={cn(
            'max-w-[720px] font-reading leading-[1.6] text-ink-700',
            lead ? 'text-[1.125rem]' : 'text-[1rem]'
          )}
        >
          {recording.summary}
        </p>

        <Link
          href={teachingHref(recording)}
          data-track="open-record"
          className="focus-ring mt-5 inline-block whitespace-nowrap font-mono text-[0.6875rem] text-navy transition-colors hover:text-gold"
        >
          THE RECORD →
        </Link>
      </div>
    </div>
  )
}
