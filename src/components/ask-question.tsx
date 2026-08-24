'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BookOpen, Church, FileText, LoaderCircle, Send, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * The question box, at the foot of anything a reader might have a
 * question about.
 *
 * People have always had questions about this ministry — about the dress
 * teaching, about a prophecy, about why any of it is taught — and about
 * the Bible itself, which is the harder and more common one. They asked
 * on other people's platforms, because this site never offered them
 * anywhere. The pastoral lines further down are a different door: they
 * are for someone in trouble, not for someone who wants to know.
 *
 * Two things had to be unmistakable on the box rather than implied, and
 * both are now said in the reader's line of sight rather than buried in a
 * paragraph:
 *
 *   - What may be asked. Naming the ministry *and* Scripture, as two
 *     kinds of question rather than one, is what tells somebody holding a
 *     question about a passage that this is for them too.
 *   - That asking costs nothing. The name and the email are optional and
 *     labelled as such; leave them and the question arrives with nobody's
 *     name on it. No account, no cookie, and no address kept beside it —
 *     which is a promise the store can actually keep, because it stores
 *     none of those things.
 *
 * The question carries the page it was asked from. Somebody asking "why
 * is this taught?" from the dress teaching and somebody asking it from
 * the Colombia record are asking two different questions, and the desk
 * cannot tell which without knowing where they stood.
 */

type State = 'idle' | 'sending' | 'sent'

const MAX = 1500

export function AskQuestion({
  /** The title of the page it is standing on, sent with the question. */
  title,
  /** "this teaching", "this record" — the page, in the list of what may be asked. */
  subject = 'this page',
}: {
  title?: string
  subject?: string
}) {
  const pathname = usePathname()
  const [state, setState] = React.useState<State>('idle')
  const [error, setError] = React.useState('')
  const [length, setLength] = React.useState(0)

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
      setLength(0)
      setState('sent')
    } catch {
      setError('The question did not send. Please check your connection and try again.')
      setState('idle')
    }
  }

  return (
    <section aria-labelledby="ask-a-question" className="border-t border-rule bg-raised">
      <div className="shell grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-14 lg:py-16">
        {/* ── What may be asked, and what it costs to ask ─────────── */}
        <div>
          <p className="kicker mb-4 text-gold-ink">Ask a question</p>
          <h2
            id="ask-a-question"
            className="text-balance font-display text-[1.875rem] font-medium leading-[1.08] text-navy sm:text-[2.375rem]"
          >
            Ask the ministry. Ask about the Bible.
          </h2>
          <span aria-hidden className="mt-5 block h-[3px] w-14 rounded-full bg-gold" />

          <p className="mt-6 max-w-[46ch] text-pretty text-[1.0625rem] leading-[1.7] text-ink-900">
            Nobody should have to hold a question about what is taught here
            because there was nowhere to put it. Ask plainly — a hard question
            asked in good faith is welcome, and it reaches the desk directly.
          </p>

          {/* Answers used to reach one reader and stop there. The ones that
              were of use to more than one are pages now, and somebody about
              to type a question may find it already answered. */}
          <p className="mt-5">
            <Link
              href="/questions"
              className="focus-ring group inline-flex items-center gap-2 rounded-chip font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-gold-ink"
            >
              Read what has already been answered
              <ArrowRight
                aria-hidden
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </p>

          <ul className="mt-8 grid gap-4">
            <Topic icon={<Church aria-hidden />} name="The Ministry of Repentance and Holiness">
              What it teaches and why, what it has preached, what stands in the
              prophecy archive.
            </Topic>
            <Topic icon={<BookOpen aria-hidden />} name="The Bible">
              A passage you are working through, a doctrine, something you have
              heard taught and want tested against Scripture.
            </Topic>
            <Topic icon={<FileText aria-hidden />} name={`Or ${subject}`}>
              The page you are standing on now — it is sent with your question,
              so the answer is about the right thing.
            </Topic>
          </ul>

          <p className="mt-8 flex max-w-[46ch] items-start gap-3 rounded-panel border border-rule bg-card px-5 py-4 text-[0.875rem] leading-[1.65] text-ink-muted">
            <UserRound aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>
              <strong className="font-semibold text-ink-900">You stay anonymous.</strong>{' '}
              Your name and email are optional — leave them blank and your
              question arrives with nobody&rsquo;s name on it. There is no account
              to make, no cookie set, and no address kept beside what you wrote.
              An email, if you give one, is used to write back to you and is
              never published.
            </span>
          </p>
        </div>

        {/* ── The box itself ──────────────────────────────────────── */}
        {state === 'sent' ? (
          <div
            role="status"
            className="self-center rounded-panel border border-rule bg-card p-7 shadow-sm sm:p-8"
          >
            <span aria-hidden className="mb-5 block h-[3px] w-14 rounded-full bg-gold" />
            <p className="font-display text-[1.5rem] leading-snug text-navy">
              Your question is with the desk.
            </p>
            <p className="mt-4 text-[0.9375rem] leading-[1.7] text-ink-muted">
              Thank you for asking it. If you left an email address, someone
              writes back to you there. Nothing you sent appears on this site
              unless it is answered publicly — and never with your address.
            </p>
            <p className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button
                type="button"
                onClick={() => setState('idle')}
                className="font-mono text-[0.75rem] tracking-[0.06em] text-navy transition-colors hover:text-gold"
              >
                ASK ANOTHER →
              </button>
              <Link
                href="/questions"
                className="font-mono text-[0.75rem] tracking-[0.06em] text-gold-ink transition-colors hover:text-gold"
              >
                QUESTIONS ANSWERED →
              </Link>
            </p>
          </div>
        ) : (
          <form
            onSubmit={send}
            className="self-center rounded-panel border border-rule bg-card p-6 shadow-sm sm:p-7"
          >
            <div className="mb-2.5 flex items-baseline justify-between gap-4">
              <label htmlFor="question-body" className="kicker text-ink-subtle">
                Your question
              </label>
              <span
                aria-hidden
                className={`font-mono text-[0.6875rem] tabular-nums ${
                  length > MAX - 100 ? 'text-gold-ink' : 'text-ink-subtle'
                }`}
              >
                {length > 0 ? `${length}/${MAX}` : ''}
              </span>
            </div>
            {/* Four lines, and a handle to pull down for more. The field
                used to grow into whatever height the column beside it had,
                which made a card the size of a page out of a box that only
                ever needs a sentence or two to start with. */}
            <textarea
              id="question-body"
              name="body"
              required
              rows={4}
              maxLength={MAX}
              onChange={(event) => setLength(event.target.value.length)}
              placeholder="For example: what does the ministry mean by repentance, and where is it taught in Scripture?"
              className="focus-ring w-full resize-y rounded-2xl border border-hairline-strong bg-surface px-5 py-3.5 text-[0.9375rem] leading-[1.7] text-ink placeholder:text-ink-subtle transition-colors focus:border-gold/60"
            />

            <p className="mt-5 border-t border-rule-soft pt-4 text-[0.8125rem] leading-[1.6] text-ink-muted">
              Both of these are optional. Fill them in only if you would like a
              reply meant for you.
            </p>
            <div className="mt-3.5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="question-name" className="kicker block text-ink-subtle">
                  Your name
                </label>
                <Input
                  id="question-name"
                  name="name"
                  maxLength={80}
                  autoComplete="name"
                  className="mt-2.5"
                  placeholder="Only if you wish"
                />
              </div>
              <div>
                <label htmlFor="question-email" className="kicker block text-ink-subtle">
                  Email
                </label>
                <Input
                  id="question-email"
                  name="email"
                  type="email"
                  maxLength={160}
                  autoComplete="email"
                  className="mt-2.5"
                  placeholder="Only for a reply"
                />
              </div>
            </div>

            {/* The honeypot: out of sight, out of the tab order, and never
                autofilled. A person does not fill it in; something filling
                every field does. */}
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

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
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
                {error || 'Anonymous unless you say otherwise.'}
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

/** One kind of question a reader may bring, named and then described. */
function Topic({
  icon,
  name,
  children,
}: {
  icon: React.ReactNode
  name: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-chip-gold text-gold-ink [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </span>
      <span className="block">
        <span className="block font-display text-[1.0625rem] leading-snug text-navy">{name}</span>
        <span className="mt-1 block max-w-[42ch] text-[0.875rem] leading-[1.6] text-ink-muted">
          {children}
        </span>
      </span>
    </li>
  )
}
