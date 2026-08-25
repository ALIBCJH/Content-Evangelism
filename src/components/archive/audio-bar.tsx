'use client'

import * as React from 'react'
import Link from 'next/link'
import { clock, type SpeechState } from '@/lib/speech'

/**
 * What is being read aloud, where the reader can see it.
 *
 * The player lives in the rail, which on a wide screen is beside the
 * teaching and in plain sight. On a phone the rail is the last thing on
 * the page — the writing comes first there, which is right — so a reader
 * who pressed Listen got a player several screens below them and no sign
 * that anything had happened. It looked broken because it was invisible.
 *
 * So below `lg` the player is a bar at the foot of the window instead. It
 * appears only while something is loaded, sits above the ask button, and
 * carries the same three controls the rail does.
 *
 * A teaching's own page has no rail player at any width — the controls
 * there are in the band, and a reader who has scrolled past them is as
 * stranded on a desktop as on a phone. So that page asks for the bar
 * `everywhere`, and the breakpoint that hides it goes away.
 */
export function AudioBar({
  speech,
  onPause,
  onResume,
  onStop,
  everywhere = false,
}: {
  speech: SpeechState
  onPause: () => void
  onResume: () => void
  onStop: () => void
  /** Shown at every width, for a page with no rail player to fall back on. */
  everywhere?: boolean
}) {
  /* The ask button is fixed to the same corner and knows nothing about
     this bar. Rather than thread state through the layout that holds
     them both, the body says a bar is up and the stylesheet lifts the
     button over it — see `[data-audio]` in globals.css. The reader's
     navigation is pinned below both, and `.audio-bar` is what stands
     this off it rather than over it. */
  const playing = Boolean(speech.piece)
  React.useEffect(() => {
    if (!playing) return
    document.body.dataset.audio = 'on'
    return () => {
      delete document.body.dataset.audio
    }
  }, [playing])

  if (!speech.piece) return null

  return (
    <div className={`audio-bar fixed inset-x-0 bottom-0 z-40 border-t border-gold-pale/30 bg-plate px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-plate-pale shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.5)] ${everywhere ? '' : 'lg:hidden'}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={speech.status === 'playing' ? onPause : onResume}
          disabled={speech.status === 'loading' || speech.status === 'failed' || speech.status === 'unsupported'}
          className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold-pale/60 text-gold-pale transition-colors disabled:opacity-50"
        >
          {speech.status === 'playing' ? <PauseMark /> : <PlayMark />}
          <span className="sr-only">
            {speech.status === 'playing' ? 'Pause' : 'Play'} {speech.piece.title}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <Link
            href={speech.piece.href}
            className="focus-ring block truncate text-[0.875rem] font-semibold leading-[1.3] text-plate-pale"
          >
            {speech.piece.title}
          </Link>
          <p className="kicker mt-0.5 text-gold-pale/70">
            {speech.status === 'loading' && 'Starting…'}
            {speech.status === 'failed' && 'Could not read this one'}
            {speech.status === 'unsupported' && 'No voice installed on this device'}
            {(speech.status === 'playing' || speech.status === 'paused') && (
              <>
                <span className="tabular">{clock(speech.elapsed)}</span> /{' '}
                <span className="tabular">~{clock(speech.total)}</span>
                {speech.status === 'paused' && ' · paused'}
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onStop}
          className="focus-ring shrink-0 rounded-full p-2 text-plate-pale/70 transition-colors"
        >
          <CloseMark />
          <span className="sr-only">Stop reading</span>
        </button>
      </div>
    </div>
  )
}

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 translate-x-px fill-current">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  )
}

function CloseMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 stroke-current" fill="none" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}
