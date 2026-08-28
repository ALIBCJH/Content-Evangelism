'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUp, Loader2, MessageCircleQuestion, Search, Send, X } from 'lucide-react'

/**
 * The way to ask, from anywhere on the site.
 *
 * The question box at the foot of a teaching only helps a reader who has
 * finished it and scrolled past the end. A question does not wait for
 * that — it arrives in the middle of a paragraph, on the archive listing,
 * or on a page that has no box at all.
 *
 * What comes back is answered from what this site has published and
 * nothing else, and it carries the teachings it was drawn from, because
 * the point is to get the reader to the teaching rather than to be
 * believed on its own account. Where the archive says nothing, it says
 * that.
 *
 * When answering is not switched on — no key in the environment — the
 * panel goes back to being the two doors that always worked, rather than
 * a composer that takes a question nowhere.
 */

interface Source {
  title: string
  heading?: string
  url: string
  kind: string
}

type State =
  | { status: 'idle' }
  | { status: 'asking' }
  | { status: 'answering'; answer: string; sources: Source[] }
  | { status: 'answered'; answer: string; sources: Source[] }
  | { status: 'unavailable' }
  | { status: 'error'; message: string }

export function AskBot() {
  const [open, setOpen] = React.useState(false)
  const [question, setQuestion] = React.useState('')
  const [state, setState] = React.useState<State>({ status: 'idle' })
  const panelRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  /* A click anywhere else puts it away. There is no backdrop: this sits
     beside the reading rather than on top of it. */
  React.useEffect(() => {
    if (!open) return
    function onDown(event: MouseEvent) {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  React.useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  /* On a phone the launcher sits on top of the teaching, because a fixed
     mark on a 390px screen has nowhere else to be. So it gets out of the
     way while the reader is going down the page, and comes back when they
     stop or turn back — the reading is the thing, and the button can
     wait. It never hides while the panel is open, and never on a wide
     screen, where there is margin for it to sit in. */
  const [hidden, setHidden] = React.useState(false)
  React.useEffect(() => {
    if (open) {
      setHidden(false)
      return
    }
    let last = window.scrollY
    let idle = 0
    const onScroll = () => {
      const now = window.scrollY
      const wide = window.matchMedia('(min-width: 640px)').matches
      if (!wide && now > last + 8 && now > 240) setHidden(true)
      else if (now < last - 8) setHidden(false)
      last = now
      window.clearTimeout(idle)
      idle = window.setTimeout(() => setHidden(false), 900)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(idle)
      window.removeEventListener('scroll', onScroll)
    }
  }, [open])

  const ask = async (event: React.FormEvent) => {
    event.preventDefault()
    const asked = question.trim()
    if (asked.length < 3 || state.status === 'asking' || state.status === 'answering') return

    setState({ status: 'asking' })
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: asked }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const code = payload?.error?.code
        setState(
          code === 'NOT_CONFIGURED'
            ? { status: 'unavailable' }
            : { status: 'error', message: payload?.error?.message ?? 'That did not go through.' }
        )
        return
      }

      /* An answer with no passages behind it comes back whole, as JSON. */
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        const payload = await response.json()
        setState({ status: 'answered', answer: payload.answer, sources: payload.sources ?? [] })
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        setState({ status: 'error', message: 'That did not go through.' })
        return
      }

      /* The first line is the sources; everything after it is the answer,
         arriving a few words at a time. */
      const decoder = new TextDecoder()
      let buffered = ''
      let sources: Source[] = []
      let answer = ''
      let headerRead = false

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffered += decoder.decode(value, { stream: true })

        if (!headerRead) {
          const newline = buffered.indexOf('\n')
          if (newline === -1) continue
          try {
            sources = JSON.parse(buffered.slice(0, newline)).sources ?? []
          } catch {
            sources = []
          }
          buffered = buffered.slice(newline + 1)
          headerRead = true
        }

        answer += buffered
        buffered = ''
        setState({ status: 'answering', answer, sources })
      }

      setState({ status: 'answered', answer: answer.trim(), sources })
    } catch {
      setState({ status: 'error', message: 'Could not reach the archive.' })
    }
  }

  const answering = state.status === 'asking' || state.status === 'answering'
  const shown = state.status === 'answering' || state.status === 'answered' ? state : null

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          id="ask-bot-panel"
          role="dialog"
          aria-labelledby="ask-bot-title"
          /* A sheet on a phone, the floating card it always was from `sm`
             up. Two reasons it could not stay a card at every width: a
             conversation in a 24rem box anchored to a corner is a hard
             read on a six-inch screen, and the box was measured in `vh` —
             which on iOS is the window with the URL bar retracted and
             takes no notice of the keyboard, so the field a reader was
             typing into could sit underneath the keyboard they were
             typing on. `dvh` is the viewport as it actually is. */
          className="ask-panel fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col pb-[env(safe-area-inset-bottom)] sm:pb-0 rounded-t-panel border border-rule bg-card shadow-glow-soft sm:inset-x-auto sm:bottom-[5.5rem] sm:right-6 sm:max-h-[min(32rem,calc(100dvh-8rem))] sm:w-[min(24rem,calc(100vw-3rem))] sm:rounded-panel"
        >
          <div className="border-b border-rule px-5 pb-3.5 pt-4">
            <span className="kicker text-gold">Ask the archive</span>
            <h2 id="ask-bot-title" className="mt-1 font-apparatus text-[0.9375rem] text-ink-muted">
              Answered from what this site has published
            </h2>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {state.status === 'idle' && (
              <div className="flex flex-col gap-2">
                <p className="text-[0.9375rem] leading-[1.6] text-ink-muted">
                  A question about a teaching, a prophecy, or a passage. The answer comes from the
                  ministry&apos;s own published words, with the teachings it came from underneath.
                </p>
                <ul className="mt-1 flex flex-col gap-1.5">
                  {[
                    'What is the difference between the rapture and the second coming?',
                    'Why does the ministry preach against the prosperity gospel?',
                  ].map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => {
                          setQuestion(suggestion)
                          inputRef.current?.focus()
                        }}
                        className="focus-ring w-full rounded-tile border border-rule px-3 py-2 text-left text-[0.8125rem] leading-[1.45] text-ink-700 transition-colors hover:border-gold/60 hover:text-gold-ink"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {state.status === 'asking' && (
              <p className="flex items-center gap-2 text-[0.9375rem] text-ink-muted" aria-live="polite">
                <Loader2 aria-hidden className="h-4 w-4 animate-spin text-gold" />
                Reading the archive…
              </p>
            )}

            {shown && (
              <div aria-live="polite">
                <p className="whitespace-pre-wrap text-[0.9375rem] leading-[1.65] text-ink">
                  {shown.answer}
                  {state.status === 'answering' && (
                    <span aria-hidden className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-gold align-middle" />
                  )}
                </p>

                {shown.sources.length > 0 && (
                  <div className="mt-4 border-t border-rule pt-3">
                    <span className="kicker text-ink-subtle">From these teachings</span>
                    <ol className="mt-2 flex flex-col gap-1.5">
                      {shown.sources.map((source, index) => (
                        <li key={source.url} className="flex gap-2">
                          <span className="tabular shrink-0 font-mono text-[0.6875rem] text-gold">
                            [{index + 1}]
                          </span>
                          <Link
                            href={source.url}
                            onClick={() => setOpen(false)}
                            className="focus-ring text-[0.8125rem] leading-[1.4] text-navy transition-colors hover:text-gold-ink"
                          >
                            {source.title}
                            {source.heading ? (
                              <span className="text-ink-subtle"> — {source.heading}</span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {state.status === 'error' && (
              <p className="text-[0.9375rem] leading-[1.6] text-ink-muted">{state.message}</p>
            )}

            {/* Answering is not switched on. Rather than a composer that
                takes a question nowhere, the two doors that do work. */}
            {state.status === 'unavailable' && (
              <div className="flex flex-col gap-2">
                <p className="text-[0.9375rem] leading-[1.6] text-ink-muted">
                  Answering is not switched on for this site. These two doors are open.
                </p>
                <Link
                  href="/search"
                  onClick={() => setOpen(false)}
                  className="focus-ring flex items-center gap-3 rounded-tile border border-rule px-4 py-3 text-[0.9375rem] text-ink transition-colors hover:border-gold/60 hover:text-gold-ink"
                >
                  <Search aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                  Search everything published
                </Link>
                <Link
                  href="/about#ask-a-question"
                  onClick={() => setOpen(false)}
                  className="focus-ring flex items-center gap-3 rounded-tile border border-rule px-4 py-3 text-[0.9375rem] text-ink transition-colors hover:border-gold/60 hover:text-gold-ink"
                >
                  <Send aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                  Send your question to the desk
                </Link>
              </div>
            )}
          </div>

          {state.status !== 'unavailable' && (
            <form onSubmit={ask} className="border-t border-rule p-3">
              <div className="flex items-end gap-2">
                <input
                  ref={inputRef}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  maxLength={300}
                  placeholder="Ask a question…"
                  aria-label="Your question"
                  className="focus-ring min-w-0 flex-1 rounded-chip border border-rule bg-raised px-4 py-2.5 text-[0.9375rem] text-ink-900 placeholder:text-ink-subtle"
                />
                <button
                  type="submit"
                  disabled={answering || question.trim().length < 3}
                  className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cta text-cta-ink transition-colors hover:bg-cta-hover disabled:opacity-40"
                >
                  {answering ? (
                    <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp aria-hidden className="h-4 w-4" />
                  )}
                  <span className="sr-only">Ask</span>
                </button>
              </div>
              {/* Said once, quietly, and true: an answer here is a summary
                  of published teaching, and the teaching itself is one
                  click below it. */}
              <p className="mt-2 px-1 text-[0.6875rem] leading-[1.4] text-ink-subtle">
                Answers are drawn from published teachings and cite them. For anything pressing, the{' '}
                <Link href="/about" className="underline underline-offset-2 hover:text-gold-ink">
                  pastoral contacts
                </Link>{' '}
                are people.
              </p>
            </form>
          )}
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-controls="ask-bot-panel"
        /* The page is laid out under the home indicator now
           (`viewportFit: 'cover'`), so twenty pixels off the bottom is
           twenty pixels into it. The bar the launcher steps over when
           audio is playing is set in globals.css and does the same. */
        className={`ask-launcher focus-ring fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-plate text-plate-pale shadow-glow-soft transition-all duration-300 hover:bg-plate-deep active:translate-y-px sm:right-6 sm:h-14 sm:w-14 ${
          hidden ? 'pointer-events-none translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        {open ? (
          <X aria-hidden className="h-6 w-6" />
        ) : (
          <MessageCircleQuestion aria-hidden className="h-6 w-6" />
        )}
        <span className="sr-only">{open ? 'Close the question panel' : 'Ask a question'}</span>
      </button>
    </>
  )
}
