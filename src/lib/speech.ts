'use client'

import * as React from 'react'

/**
 * The archive, read aloud.
 *
 * This is the browser's own voice — `speechSynthesis` — and not a
 * recording: it costs nothing, needs no files and no per-article step at
 * the desk, at the price of sounding like the device rather than like a
 * person.
 *
 * Four things about that API have to be handled or it goes quiet without
 * saying so, which is exactly how this first shipped:
 *
 *   - An utterance that nothing holds a reference to can be collected
 *     mid-sentence. The queue below is kept in a ref for that reason and
 *     no other.
 *   - `getVoices()` is empty until the voices load, and speaking before
 *     they do gets silence. So the first call waits for them.
 *   - A long utterance is cut off part way through by every engine that
 *     has a limit, so the teaching is spoken in sentence-sized pieces
 *     rather than in one breath.
 *   - A machine with no voice installed — a Linux desktop without
 *     speech-dispatcher, most commonly — accepts `speak()` and does
 *     nothing at all. Nothing here reports itself as playing until the
 *     engine says it has started, and a start that never comes is
 *     reported as what it is.
 *   - Safari and iOS speak only what begins inside a gesture, and the
 *     gesture is gone by the time a fetch returns. An empty utterance
 *     spoken in the click is not enough on a phone — it is a no-op, and
 *     the queue stays locked. So the teaching's own title is spoken
 *     there instead: real audio, inside the tap, which unlocks the queue
 *     and tells the reader at once that something is happening. The body
 *     follows it when the text arrives.
 *   - `pause()` is a no-op on Android Chrome, and a pause button that
 *     does nothing is worse than none. Pausing cancels and remembers the
 *     sentence; resuming speaks it again from its start. A sentence is
 *     short enough for that to read as a pause rather than as a repeat.
 *
 * The text comes from the public API rather than from the listing, so no
 * article body crosses to the browser until somebody asks to be read to.
 */

export interface Playing {
  slug: string
  title: string
  href: string
}

export interface SpeechState {
  piece: Playing | null
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'unsupported' | 'failed'
  /** Seconds of speech so far. */
  elapsed: number
  /** Estimated seconds end to end; refined as it reads. */
  total: number
}

/** Words a minute a default voice reads at, for the first estimate. */
const WPM = 165

/**
 * How much is handed over at once. Short enough to stay under every
 * engine's cut-off, long enough that the joins are not heard.
 */
const CHUNK = 160

/** How long to wait for the engine to actually start before giving up. */
const START_TIMEOUT = 4000

function available(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** The teaching, in sentences the engine will not truncate. */
export function chunk(text: string): string[] {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*\s*/g) ?? [text]
  const out: string[] = []
  let held = ''
  for (const sentence of sentences) {
    if (held && (held + sentence).length > CHUNK) {
      out.push(held.trim())
      held = sentence
    } else {
      held += sentence
    }
  }
  if (held.trim()) out.push(held.trim())
  return out.filter(Boolean)
}

/**
 * The voices, once the browser has them. Chrome populates the list
 * asynchronously and fires `voiceschanged`; Safari has them at once. An
 * empty list after the wait means this machine has no voice installed.
 */
function voices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const ready = window.speechSynthesis.getVoices()
    if (ready.length > 0) {
      resolve(ready)
      return
    }
    const done = () => {
      window.speechSynthesis.onvoiceschanged = null
      resolve(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.onvoiceschanged = done
    window.setTimeout(done, 1500)
  })
}

/** An English voice, preferring one that lives on the device. */
function pickVoice(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = all.filter((voice) => voice.lang?.toLowerCase().startsWith('en'))
  return english.find((voice) => voice.localService) ?? english[0] ?? all[0]
}

export function useSpeech() {
  const [state, setState] = React.useState<SpeechState>({
    piece: null,
    status: 'idle',
    elapsed: 0,
    total: 0,
  })

  /* Held so the engine's own references are not the only ones: an
     utterance the page has dropped can be collected while it is speaking,
     which is heard as the voice stopping for no reason. */
  const queue = React.useRef<{
    parts: string[]
    at: number
    spoken: number
    length: number
    startedAt: number
    utterance: SpeechSynthesisUtterance | null
    token: number
    /** The title finished before the body arrived; the body starts itself. */
    awaiting: boolean
  }>({
    parts: [],
    at: 0,
    spoken: 0,
    length: 0,
    startedAt: 0,
    utterance: null,
    token: 0,
    awaiting: false,
  })

  const stop = React.useCallback(() => {
    queue.current.token += 1
    queue.current.utterance = null
    queue.current.parts = []
    if (available()) window.speechSynthesis.cancel()
    setState({ piece: null, status: 'idle', elapsed: 0, total: 0 })
  }, [])

  /* A voice left speaking outlives the page it was started on. */
  React.useEffect(() => {
    if (!available()) return
    const cancel = () => window.speechSynthesis.cancel()
    window.addEventListener('pagehide', cancel)
    return () => {
      cancel()
      window.removeEventListener('pagehide', cancel)
    }
  }, [])

  /* The clock, while something is genuinely being read. */
  React.useEffect(() => {
    if (state.status !== 'playing') return
    const tick = window.setInterval(() => {
      setState((current) => {
        const held = queue.current
        const elapsed = (Date.now() - held.startedAt) / 1000
        /* Once a stretch has been read, this reader's real rate beats the
           guessed one. */
        const measured =
          held.spoken > held.length * 0.05 && held.spoken > 0
            ? (elapsed * held.length) / held.spoken
            : 0
        return { ...current, elapsed, total: Math.round(measured) || current.total }
      })
    }, 500)
    return () => window.clearInterval(tick)
  }, [state.status])

  const speakFrom = React.useCallback(
    (index: number, token: number) => {
      const held = queue.current
      if (token !== held.token) return
      const part = held.parts[index]
      if (part === undefined) {
        stop()
        return
      }

      /* Recorded before it is spoken, so a pause knows where to come
         back to — Android cancels rather than pauses. */
      held.at = index
      const utterance = new SpeechSynthesisUtterance(part)
      const chosen = pickVoice(window.speechSynthesis.getVoices())
      if (chosen) {
        utterance.voice = chosen
        utterance.lang = chosen.lang
      }
      utterance.rate = 1

      utterance.onend = () => {
        if (token !== queue.current.token) return
        queue.current.spoken += part.length
        queue.current.at = index + 1
        speakFrom(index + 1, token)
      }
      utterance.onerror = () => {
        if (token !== queue.current.token) return
        setState((current) => ({ ...current, status: 'failed' }))
      }

      held.utterance = utterance
      window.speechSynthesis.speak(utterance)
    },
    [stop]
  )

  const play = React.useCallback(
    async (piece: Playing) => {
      if (!available()) {
        setState({ piece, status: 'unsupported', elapsed: 0, total: 0 })
        return
      }

      window.speechSynthesis.cancel()
      const token = queue.current.token + 1
      queue.current = {
        parts: [],
        at: 0,
        spoken: 0,
        length: 0,
        startedAt: Date.now(),
        utterance: null,
        token,
        awaiting: false,
      }
      setState({ piece, status: 'loading', elapsed: 0, total: 0 })

      /* Spoken inside the tap that asked for it, before anything is
         awaited: a phone only permits speech that begins in a gesture,
         and the gesture does not survive a fetch. The title is real audio
         — an empty utterance is a no-op on iOS and leaves the queue shut. */
      const opener = new SpeechSynthesisUtterance(piece.title)
      const ready = window.speechSynthesis.getVoices()
      const early = pickVoice(ready)
      if (early) {
        opener.voice = early
        opener.lang = early.lang
      }
      opener.onstart = () => {
        if (token !== queue.current.token) return
        window.clearTimeout(watchdog)
        queue.current.startedAt = Date.now()
        setState((current) => ({ ...current, status: 'playing' }))
      }
      opener.onend = () => {
        if (token !== queue.current.token) return
        /* The body may not have arrived yet; if not, it starts itself. */
        if (queue.current.parts.length > 0) speakFrom(0, token)
        else queue.current.awaiting = true
      }
      opener.onerror = () => {
        if (token !== queue.current.token) return
        window.clearTimeout(watchdog)
        setState({ piece, status: 'failed', elapsed: 0, total: 0 })
      }
      queue.current.utterance = opener

      /* A machine with no voice accepts speak() and stays silent, so the
         claim that it is playing waits for the engine to say it started. */
      const watchdog = window.setTimeout(() => {
        if (token !== queue.current.token) return
        if (!window.speechSynthesis.speaking) {
          setState((current) => ({ ...current, status: 'unsupported' }))
        }
      }, START_TIMEOUT)

      window.speechSynthesis.speak(opener)

      const found = await voices()
      if (token !== queue.current.token) return
      if (found.length === 0) {
        window.clearTimeout(watchdog)
        window.speechSynthesis.cancel()
        setState({ piece, status: 'unsupported', elapsed: 0, total: 0 })
        return
      }

      let text = ''
      try {
        const response = await fetch(`/api/v1/articles/${piece.slug}`)
        if (!response.ok) throw new Error(String(response.status))
        const payload = await response.json()
        text = String(payload?.data?.content?.text ?? '')
      } catch {
        text = ''
      }
      if (token !== queue.current.token) return
      if (!text) {
        window.speechSynthesis.cancel()
        setState({ piece, status: 'failed', elapsed: 0, total: 0 })
        return
      }

      const parts = chunk(text)
      const words = text.split(/\s+/).filter(Boolean).length
      queue.current.parts = parts
      queue.current.length = text.length
      setState((current) => ({
        ...current,
        total: Math.round((words / WPM) * 60),
      }))

      /* The title finished while the text was in the air. */
      if (queue.current.awaiting) {
        queue.current.awaiting = false
        speakFrom(0, token)
      }
    },
    [speakFrom]
  )

  /* `pause()` is a no-op on Android Chrome, so pausing stops the engine
     and remembers the sentence. Resuming speaks that sentence again from
     its beginning, which at this length reads as a pause rather than as a
     repetition — and it behaves the same on every engine, which a button
     that works on one of them does not. */
  const pause = React.useCallback(() => {
    if (!available()) return
    window.speechSynthesis.cancel()
    setState((current) => ({ ...current, status: 'paused' }))
  }, [])

  const resume = React.useCallback(() => {
    if (!available()) return
    const held = queue.current
    if (held.parts.length === 0) return
    held.startedAt = Date.now() - state.elapsed * 1000
    setState((current) => ({ ...current, status: 'playing' }))
    speakFrom(held.at, held.token)
  }, [speakFrom, state.elapsed])

  return { ...state, play, pause, resume, stop, supported: available() }
}

/** Seconds as a listener reads a clock: 2:41. */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}
