'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { Check, ExternalLink, LoaderCircle, Trash2, Undo2, Upload, XCircle } from 'lucide-react'
import type { PublishInput, Question, QuestionStatus } from '@/lib/questions'
import { Button } from '@/components/ui/button'

/**
 * The question queue, for the desk.
 *
 * Behind the door like everything under /admin, and here that door is
 * doing real work: these are people's words, sometimes their names, and
 * sometimes an email address they gave in confidence so that somebody
 * would write back.
 *
 * The queue is ordered newest first and filtered by where a question
 * stands, because the only question that matters on opening this page is
 * "what has nobody answered yet". A note can be kept against any of them —
 * a draft of the answer, or the reason it was set aside — so the thinking
 * survives whoever was at the desk that day.
 *
 * Any of them can also be answered in the open, which is a second thing
 * and not a status: the desk writes out the question as it should be
 * published and the answer under it, and that pair becomes a page at
 * /questions. What the reader typed never goes up — an answer worth
 * publishing is worth wording — and neither does their name or address.
 * Taking a page down is one button, and the address it had is kept
 * against the question so that putting it back does not break a link
 * somebody has already shared.
 */

const FILTERS: { key: QuestionStatus | 'all'; label: string }[] = [
  { key: 'new', label: 'Unanswered' },
  { key: 'answered', label: 'Answered' },
  { key: 'set-aside', label: 'Set aside' },
  { key: 'all', label: 'Everything' },
]

const STATUS_LABEL: Record<QuestionStatus, string> = {
  new: 'Unanswered',
  answered: 'Answered',
  'set-aside': 'Set aside',
}

/**
 * Answering one in the open.
 *
 * Two fields and never one: the question as it should be published, which
 * is the desk's sentence rather than the reader's paragraph, and the
 * answer, written in the same grammar a teaching is written in. The
 * fields start from what is already there — the published pair if this
 * has been up before, otherwise the reader's words and the desk's note,
 * which is usually where the answer was drafted.
 */
function PublishPanel({
  question,
  busy,
  onPublish,
  onTakeDown,
}: {
  question: Question
  busy: boolean
  onPublish: (published: PublishInput) => void
  onTakeDown: () => void
}) {
  const [asked, setAsked] = React.useState(
    question.published?.question ?? question.body.slice(0, 300)
  )
  const [answer, setAnswer] = React.useState(question.published?.answer ?? question.note ?? '')

  const ready = asked.trim().length >= 10 && answer.trim().length >= 20

  return (
    <details open={Boolean(question.published)} className="mt-6 border-t border-rule pt-5">
      <summary className="cursor-pointer font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-navy hover:text-gold">
        {question.published ? 'Published answer' : 'Answer in the open'}
      </summary>

      <p className="mt-4 max-w-[60ch] text-[0.8125rem] leading-[1.65] text-ink-muted">
        This becomes a page at <code className="font-mono">/questions</code>. The reader&rsquo;s own
        words, their name and their address are never part of it — write the question out as it
        should be read by somebody who did not ask it.
      </p>

      <label className="kicker mt-5 block text-ink-subtle" htmlFor={`asked-${question.id}`}>
        The question, as published
      </label>
      <textarea
        id={`asked-${question.id}`}
        value={asked}
        rows={2}
        onChange={(event) => setAsked(event.target.value)}
        className="focus-ring mt-2 w-full resize-y rounded-2xl border border-hairline-strong bg-surface px-4 py-3 text-[0.9375rem] leading-[1.6] text-ink transition-colors focus:border-gold/60"
      />

      <label className="kicker mt-4 block text-ink-subtle" htmlFor={`answer-${question.id}`}>
        The answer
      </label>
      <textarea
        id={`answer-${question.id}`}
        value={answer}
        rows={8}
        placeholder="Blank line between paragraphs. ## for a heading, > for quoted Scripture, [a phrase](/articles/slug) to link a teaching."
        onChange={(event) => setAnswer(event.target.value)}
        className="focus-ring mt-2 w-full resize-y rounded-2xl border border-hairline-strong bg-surface px-4 py-3 font-reading text-[0.9375rem] leading-[1.7] text-ink placeholder:text-ink-subtle transition-colors focus:border-gold/60"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={busy || !ready}
          onClick={() => onPublish({ question: asked.trim(), answer: answer.trim() })}
        >
          <Upload aria-hidden />
          {question.published ? 'Update the page' : 'Publish'}
        </Button>
        {question.published && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={onTakeDown}
            className="text-status-danger hover:text-status-danger"
          >
            Take it down
          </Button>
        )}
        {question.published && (
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-subtle">
            /questions/{question.published.slug}
          </span>
        )}
      </div>
    </details>
  )
}

function ago(iso: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true })
  } catch {
    return iso
  }
}

export default function QuestionsPage() {
  const [questions, setQuestions] = React.useState<Question[] | null>(null)
  const [filter, setFilter] = React.useState<QuestionStatus | 'all'>('new')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [busy, setBusy] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      /* The session cookie goes with it; the key itself never comes near
         this page. */
      const response = await fetch('/api/questions', { cache: 'no-store' })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? `The desk returned ${response.status}.`)
        setQuestions(null)
      } else {
        const body = (await response.json()) as { questions: Question[] }
        setQuestions(body.questions)
      }
    } catch {
      setError('Could not reach the desk.')
    }
    setLoading(false)
  }, [])

  /* Opened on arrival. A key was accepted at the door; asking for it
     again before showing the queue was asking twice. */
  React.useEffect(() => {
    void load()
  }, [load])

  /** One question changed — patch it in place rather than reloading the queue. */
  const patch = async (
    id: string,
    body: { status?: QuestionStatus; note?: string; published?: PublishInput | null }
  ) => {
    setBusy(id)
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        question?: Question
      }
      if (!response.ok || !payload.question) {
        setError(payload.error ?? 'That did not save.')
      } else {
        const saved = payload.question
        setQuestions((current) =>
          (current ?? []).map((q) => (q.id === saved.id ? saved : q))
        )
      }
    } catch {
      setError('Could not reach the desk.')
    }
    setBusy('')
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this question for good?')) return
    setBusy(id)
    try {
      const response = await fetch(`/api/questions/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? 'That did not delete.')
      } else {
        setQuestions((current) => (current ?? []).filter((q) => q.id !== id))
      }
    } catch {
      setError('Could not reach the desk.')
    }
    setBusy('')
  }

  const all = questions ?? []
  const shown = filter === 'all' ? all : all.filter((q) => q.status === filter)
  const count = (status: QuestionStatus) => all.filter((q) => q.status === status).length

  return (
    <main className="shell max-w-[64rem] pb-24 pt-10">
      <p className="kicker mb-4 text-ink-subtle">
        <Link href="/admin" className="hover:text-gold">
          The desk
        </Link>{' '}
        · Questions
      </p>
      <h1 className="mb-3 font-display text-[2.25rem] font-medium leading-[1.05] tracking-[-0.02em] text-navy sm:text-[3rem]">
        What readers are asking
      </h1>
      <p className="mb-9 max-w-[640px] text-[0.9375rem] leading-[1.7] text-ink-700">
        Every question sent from the box at the foot of a teaching, a record,
        an article or the About page. An email address here was given so that
        somebody would write back — it is not a mailing list, and it is never
        published.
      </p>

      <div className="mb-10 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
          {loading ? 'Opening' : 'Refresh the queue'}
        </Button>
        {error && <span className="text-[0.875rem] text-status-danger">{error}</span>}
      </div>

      {questions && (
        <>
          <div className="mb-8 flex flex-wrap gap-2">
            {FILTERS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`rounded-chip border px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] transition-colors ${
                  filter === tab.key
                    ? 'border-gold/60 bg-chip-gold text-gold-ink'
                    : 'border-rule text-ink-muted hover:text-gold'
                }`}
              >
                {tab.label}
                {tab.key !== 'all' && ` · ${count(tab.key)}`}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="rounded-panel border border-rule bg-card px-6 py-8 text-[0.9375rem] text-ink-muted">
              Nothing here.
            </p>
          ) : (
            <ul className="grid gap-5">
              {shown.map((question) => (
                <li
                  key={question.id}
                  className="rounded-panel border border-rule bg-card p-6 sm:p-7"
                >
                  <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-subtle">
                    <span className="text-gold">{STATUS_LABEL[question.status]}</span>
                    <span>{ago(question.askedAt)}</span>
                    <Link href={question.fromPath} className="normal-case hover:text-gold">
                      {question.fromTitle ?? question.fromPath}
                    </Link>
                    {question.published && (
                      <Link
                        href={`/questions/${question.published.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-chip border border-gold/60 bg-chip-gold px-2.5 py-1 text-gold-ink hover:text-gold"
                      >
                        Published
                        <ExternalLink aria-hidden className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  <p className="whitespace-pre-wrap text-[1.0625rem] leading-[1.7] text-ink-900">
                    {question.body}
                  </p>

                  <p className="mt-4 text-[0.8125rem] text-ink-muted">
                    {question.name ?? 'No name given'}
                    {question.email ? (
                      <>
                        {' · '}
                        <a href={`mailto:${question.email}`} className="font-mono hover:text-gold">
                          {question.email}
                        </a>
                      </>
                    ) : (
                      ' · no reply address'
                    )}
                  </p>

                  <label className="kicker mt-6 block text-ink-subtle" htmlFor={`note-${question.id}`}>
                    Desk note
                  </label>
                  <textarea
                    id={`note-${question.id}`}
                    defaultValue={question.note ?? ''}
                    rows={3}
                    placeholder="A draft of the answer, or why this was set aside."
                    onBlur={(event) => {
                      if (event.target.value !== (question.note ?? '')) {
                        patch(question.id, { note: event.target.value })
                      }
                    }}
                    className="focus-ring mt-2 w-full resize-y rounded-2xl border border-hairline-strong bg-surface px-4 py-3 text-[0.9375rem] leading-[1.7] text-ink placeholder:text-ink-subtle transition-colors focus:border-gold/60"
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {question.status !== 'answered' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy === question.id}
                        onClick={() => patch(question.id, { status: 'answered' })}
                      >
                        <Check aria-hidden />
                        Answered
                      </Button>
                    )}
                    {question.status !== 'set-aside' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy === question.id}
                        onClick={() => patch(question.id, { status: 'set-aside' })}
                      >
                        <XCircle aria-hidden />
                        Set aside
                      </Button>
                    )}
                    {question.status !== 'new' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy === question.id}
                        onClick={() => patch(question.id, { status: 'new' })}
                      >
                        <Undo2 aria-hidden />
                        Back to unanswered
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy === question.id}
                      onClick={() => remove(question.id)}
                      className="text-status-danger hover:text-status-danger"
                    >
                      <Trash2 aria-hidden />
                      Delete
                    </Button>
                    {question.handledAt && (
                      <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-subtle">
                        touched {ago(question.handledAt)}
                      </span>
                    )}
                  </div>

                  <PublishPanel
                    question={question}
                    busy={busy === question.id}
                    onPublish={(published) => patch(question.id, { published })}
                    onTakeDown={() => patch(question.id, { published: null })}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
