'use client'

import * as React from 'react'
import { Bookmark, BookmarkCheck, Pause, Play, Square } from 'lucide-react'
import { clock, useSpeech } from '@/lib/speech'
import { useSaved } from '@/lib/saved'
import { AudioBar } from '@/components/archive/audio-bar'

/**
 * Listen, and keep — on the teaching's own page.
 *
 * Both of these already existed and neither could be reached from here.
 * The archive listing has had a player and a Save control on its cards
 * since they shipped; a reader arriving from a search result or a
 * WhatsApp message lands on the teaching itself, which had neither. That
 * is the page most readers see and the only one some of them ever see —
 * so a reader on a matatu could not be read to, and a reader about to
 * lose signal could not keep what they were reading, unless they first
 * went back to the archive and found the card for the page they were
 * already on.
 *
 * The two belong together in the band because they answer the same
 * question at the same moment: I have found this, now how do I take it
 * with me. Read it to me, or keep it for when the line drops.
 *
 * Nothing here is a promise the device cannot keep. The voice is the
 * browser's own and some machines have none installed, so the control
 * says which of those happened rather than sitting there looking pressed.
 */
export function PieceActions({
  slug,
  title,
  className = '',
  onPlate = false,
}: {
  slug: string
  title: string
  className?: string
  /**
   * Set on the ministry's navy panel rather than on paper.
   *
   * The pills are a card with a hairline round it, which on navy is a
   * white rectangle floating in the band. On the plate they are the
   * plate's own rule and the plate's own text, and the pressed state
   * moves to pale gold — the gold that carries on navy, where the ink
   * gold is a brown nobody can read there.
   */
  onPlate?: boolean
}) {
  const speech = useSpeech()
  const { ready, isSaved, toggle } = useSaved()

  /* The player is shared, and a reader may have started something else on
     the archive before arriving here. Only this teaching's own state
     belongs on this button. */
  const mine = speech.piece?.slug === slug
  const playing = mine && speech.status === 'playing'
  const paused = mine && speech.status === 'paused'
  const loading = mine && speech.status === 'loading'
  const kept = ready && isSaved(slug)

  const listen = () => {
    if (playing) return speech.pause()
    if (paused) return speech.resume()
    speech.play({ slug, title, href: `/articles/${slug}` })
  }

  const pill =
    'focus-ring inline-flex h-10 items-center gap-2 rounded-chip border px-4 font-mono text-[0.625rem] uppercase tracking-[0.12em] transition-colors [&_svg]:size-3.5'
  const resting = onPlate
    ? 'border-plate-rule bg-transparent text-plate-soft hover:border-gold hover:text-gold-pale'
    : 'border-rule bg-card text-ink-muted hover:border-gold hover:text-navy'
  const pressed = onPlate
    ? 'border-gold bg-gold/15 text-gold-pale'
    : 'border-gold bg-gold/10 text-gold-ink'

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={listen}
          disabled={loading}
          aria-pressed={playing}
          className={`${pill} ${
            mine && speech.status !== 'idle' ? pressed : resting
          } disabled:opacity-60`}
        >
          {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
          {loading ? 'Starting…' : playing ? 'Pause' : paused ? 'Resume' : 'Listen'}
          {(playing || paused) && (
            <span className="tabular normal-case tracking-normal opacity-80">
              {clock(speech.elapsed)}
            </span>
          )}
        </button>

        {mine && (playing || paused) && (
          <button
            type="button"
            onClick={speech.stop}
            className={`${pill} ${resting}`}
          >
            <Square aria-hidden />
            Stop
          </button>
        )}

        <button
          type="button"
          onClick={() => toggle(slug)}
          aria-pressed={ready ? kept : undefined}
          className={`${pill} ${kept ? pressed : resting}`}
        >
          {kept ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
          {kept ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* What the device did, where the reader is looking — the bar at the
          foot of the window says the same thing, and a reader who has not
          scrolled has not seen it. */}
      <p
        aria-live="polite"
        className={`mt-2 text-[0.8125rem] leading-[1.5] ${
          onPlate ? 'empty:mt-0 text-plate-soft' : 'min-h-[1.25rem] text-ink-subtle'
        }`}
      >
        {mine && speech.status === 'unsupported'
          ? 'This device has no voice installed, so it cannot read aloud.'
          : mine && speech.status === 'failed'
            ? 'That could not be read aloud. The teaching itself is unaffected.'
            : kept
              ? 'Kept on this device — it opens without a connection, and waits under Saved in the archive.'
              : ''}
      </p>

      <AudioBar
        speech={speech}
        onPause={speech.pause}
        onResume={speech.resume}
        onStop={speech.stop}
        everywhere
      />
    </div>
  )
}
