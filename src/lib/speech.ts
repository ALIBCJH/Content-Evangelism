'use client'

import * as React from 'react'

/**
 * The archive, read aloud.
 *
 * This is the browser's own voice — `speechSynthesis`, which every
 * current browser carries — and not a recording. That is a deliberate
 * trade and worth stating plainly: the voice is the device's, so it is
 * serviceable rather than beautiful, and it costs nothing, needs no
 * files, no service and no per-article step at the desk. A ministry that
 * publishes a teaching a week should not have to run an audio pipeline to
 * let somebody listen to one on a matatu.
 *
 * The text comes from the public API rather than from the listing. The
 * archive deliberately never ships article bodies to the browser — sixty
 * kilobytes a piece it does not print — so nothing is fetched until a
 * reader actually asks to be read to, and then only the piece they asked
 * for.
 *
 * Position is honest about being an estimate. `speechSynthesis` reports
 * where it is in the string, not in time, so elapsed is measured and the
 * total is the remaining characters at the rate this reader is actually
 * being read to. It settles within a few seconds of starting and is
 * marked as approximate wherever it is shown.
 */

export interface Playing {
  slug: string
  title: string
  href: string
}

export interface SpeechState {
  /** What is loaded, playing or paused. */
  piece: Playing | null
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'unsupported' | 'failed'
  /** Seconds of speech so far. */
  elapsed: number
  /** Estimated seconds end to end; 0 until there is enough to estimate. */
  total: number
}

/** Words per minute a default voice reads at, for the first estimate. */
const WPM = 165

function supported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function useSpeech() {
  const [state, setState] = React.useState<SpeechState>({
    piece: null,
    status: 'idle',
    elapsed: 0,
    total: 0,
  })

  const spoken = React.useRef({ chars: 0, length: 0, startedAt: 0 })

  /* A voice left speaking when the page goes is a voice that carries on
     into whatever the reader opened next. */
  React.useEffect(() => {
    if (!supported()) return
    const stop = () => window.speechSynthesis.cancel()
    window.addEventListener('pagehide', stop)
    return () => {
      stop()
      window.removeEventListener('pagehide', stop)
    }
  }, [])

  /* The clock, while something is being read. */
  React.useEffect(() => {
    if (state.status !== 'playing') return
    const tick = window.setInterval(() => {
      setState((current) => {
        const elapsed = (Date.now() - spoken.current.startedAt) / 1000
        /* Once a tenth of the way in, the reader's real rate beats the
           guessed one; before that the word count is all there is. */
        const { chars, length } = spoken.current
        const measured = chars > length * 0.1 && chars > 0 ? (elapsed * length) / chars : 0
        return { ...current, elapsed, total: measured || current.total }
      })
    }, 500)
    return () => window.clearInterval(tick)
  }, [state.status])

  const stop = React.useCallback(() => {
    if (supported()) window.speechSynthesis.cancel()
    setState({ piece: null, status: 'idle', elapsed: 0, total: 0 })
  }, [])

  const pause = React.useCallback(() => {
    if (!supported()) return
    window.speechSynthesis.pause()
    setState((current) => ({ ...current, status: 'paused' }))
  }, [])

  const resume = React.useCallback(() => {
    if (!supported()) return
    window.speechSynthesis.resume()
    /* The clock is wall time, so it has to be told about the gap. */
    spoken.current.startedAt = Date.now() - state.elapsed * 1000
    setState((current) => ({ ...current, status: 'playing' }))
  }, [state.elapsed])

  const play = React.useCallback(
    async (piece: Playing) => {
      if (!supported()) {
        setState({ piece, status: 'unsupported', elapsed: 0, total: 0 })
        return
      }

      window.speechSynthesis.cancel()
      setState({ piece, status: 'loading', elapsed: 0, total: 0 })

      let text = ''
      try {
        const response = await fetch(`/api/v1/articles/${piece.slug}`)
        if (!response.ok) throw new Error(String(response.status))
        const payload = await response.json()
        text = String(payload?.data?.content?.text ?? '')
      } catch {
        setState({ piece, status: 'failed', elapsed: 0, total: 0 })
        return
      }
      if (!text) {
        setState({ piece, status: 'failed', elapsed: 0, total: 0 })
        return
      }

      const words = text.split(/\s+/).filter(Boolean).length
      spoken.current = { chars: 0, length: text.length, startedAt: Date.now() }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en'
      utterance.rate = 1
      utterance.onboundary = (event) => {
        spoken.current.chars = event.charIndex
      }
      utterance.onend = () => stop()
      utterance.onerror = () => {
        setState((current) => ({ ...current, status: 'failed' }))
      }

      setState({
        piece,
        status: 'playing',
        elapsed: 0,
        total: Math.round((words / WPM) * 60),
      })
      window.speechSynthesis.speak(utterance)
    },
    [stop]
  )

  return { ...state, play, pause, resume, stop, supported: supported() }
}

/** Seconds as a listener reads a clock: 2:41. */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}
