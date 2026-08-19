'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { LoaderCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * The question box, at the foot of anything a reader might have a
 * question about.
 *
 * People ask about this ministry constantly — about the dress teaching,
 * about a prophecy, about why any of it is taught — and they ask on other
 * people's platforms, because this site never offered them anywhere. The
 * pastoral lines further down are a different door: they are for someone
 * in trouble, not for someone who wants to know something.
 *
 * Three things are said plainly on the box, because a reader deciding
 * whether to type is deciding whether to trust it: what happens to the
 * question, that the email is for a reply and is never published, and
 * that a name is optional. Nothing is asked for that the desk does not
 * need to answer.
 *
 * The question carries the page it was asked from. Somebody asking "why
 * is this taught?" from the dress teaching and somebody asking it from
 * the Colombia record are asking two different questions, and the desk
 * cannot tell which without knowing where they stood.
 */

type State = 'idle' | 'sending' | 'sent'

export function AskQuestion({
  /** The title of the page it is standing on, sent with the question. */
  title,
  /** "this teaching", "this record" — how the box refers to the page. */
  subject = 'this page',
}: {
  title?: string
  subject?: string
}) {
  const pathname = usePathname()
  const [state, setState] = React.useState<State>('idle')
  const [error, setError] = React.useState('')

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    setState('sending')
    setError('')
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: data.get('body'),
          name: data.get('name'),
          email: data.get('email'),
          website: data.get('website'),
          fromPath: pathname,
          fromTitle: title,
        }),
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        setError(payload.error ?? 'The question did not send. Please try again shortly.')
        setState('idle')
        return
      }
      form.reset()
      setState('sent')
    } catch {
      setError('The question did not send. Please check your connection and try again.')
      setState('idle')
    }
  }

  return (
    <section aria-labelledby="ask-a-question" className="border-t border-rule bg-raised">
      <div className="shell grid gap-10 py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16 lg:py-16">
        <div>
          <p className="kicker mb-4 text-gold-ink">Ask a question</p>
          <h2
            id="ask-a-question"
            className="font-display text-[1.75rem] font-medium leading-[1.1] text-navy sm:text-[2.125rem]"
          >
            Is there something here you want to ask about?
          </h2>
          <span aria-hidden className="mt-5 block h-[3px] w-14 rounded-full bg-gold" />
          <p className="mt-6 max-w-[46ch] text-pretty text-[1.0625rem] leading-[1.7] text-ink-900">
            Questions about {subject} — or about the ministry, the teaching, or
            anything published here — go straight to the desk. Ask plainly. A
            question asked in good faith is welcome even when it is a hard one.
          </p>
          <p className="mt-4 max-w-[46ch] text-[0.875rem] leading-[1.7] text-ink-muted">
            We answer as we are able, and where an answer would serve everyone
            asking the same thing, we publish it. Your name is yours to give or
            withhold; your email is only ever used to write back to you, and is
            never published. If you need help now rather than an answer, the
            pastoral lines below are the faster door.
          </p>
        </div>

        {state === 'sent' ? (
          <div
            role="status"
            className="flex flex-col justify-center rounded-panel border border-rule bg-card p-8"
          >
            <p className="font-display text-[1.375rem] leading-snug text-navy">
              Your question is with the desk.
            </p>
            <p className="mt-3 text-[0.9375rem] leading-[1.7] text-ink-muted">
              Thank you for asking it. If you left an email address, someone
              writes back to you there. Nothing you sent appears on this site
              unless it is answered publicly, and never with your address.
            </p>
            <button
              type="button"
              onClick={() => setState('idle')}
              className="mt-6 self-start font-mono text-[0.75rem] tracking-[0.06em] text-navy transition-colors hover:text-gold"
            >
              ASK ANOTHER →
            </button>
          </div>
        ) : (
          <form
            onSubmit={send}
            className="rounded-panel border border-rule bg-card p-6 sm:p-8"
          >
            <label htmlFor="question-body" className="kicker block text-ink-subtle">
              Your question
            </label>
            <textarea
              id="question-body"
              name="body"
              required
              rows={5}
              maxLength={1500}
              placeholder="What would you like to ask?"
              className="focus-ring mt-2.5 w-full resize-y rounded-2xl border border-hairline-strong bg-surface px-5 py-4 text-[1rem] leading-[1.7] text-ink placeholder:text-ink-subtle transition-colors focus:border-gold/60"
            />

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="question-name" className="kicker block text-ink-subtle">
                  Your name <span className="normal-case tracking-normal">(optional)</span>
                </label>
                <Input
                  id="question-name"
                  name="name"
                  maxLength={80}
                  autoComplete="name"
                  className="mt-2.5"
                  placeholder="If you would like to give it"
                />
              </div>
              <div>
                <label htmlFor="question-email" className="kicker block text-ink-subtle">
                  Email <span className="normal-case tracking-normal">(optional)</span>
                </label>
                <Input
                  id="question-email"
                  name="email"
                  type="email"
                  maxLength={160}
                  autoComplete="email"
                  className="mt-2.5"
                  placeholder="Only so we can reply"
                />
              </div>
            </div>

            {/* The honeypot: off-screen, unlabelled to a reader, skipped by
                the tab order, and never autofilled. A person does not fill
                it in; something filling every field does. */}
            <div aria-hidden className="sr-only">
              <label htmlFor="question-website">Website</label>
              <input
                id="question-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={state === 'sending'} className="gap-2.5 px-7">
                {state === 'sending' ? (
                  <LoaderCircle aria-hidden className="animate-spin" />
                ) : (
                  <Send aria-hidden />
                )}
                {state === 'sending' ? 'Sending' : 'Send the question'}
              </Button>
              <p
                aria-live="polite"
                className={`text-[0.8125rem] leading-[1.6] ${
                  error ? 'text-status-danger' : 'text-ink-muted'
                }`}
              >
                {error || 'No account, and nothing else asked of you.'}
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
