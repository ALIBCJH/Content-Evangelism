'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { Check, LoaderCircle, Trash2, Undo2, XCircle } from 'lucide-react'
import type { Question, QuestionStatus } from '@/lib/questions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * The question queue, for the desk.
 *
 * Behind the posting key like everything under /admin, and here the key is
 * doing real work: these are people's words, sometimes their names, and
 * sometimes an email address they gave in confidence so that somebody
 * would write back.
 *
 * The queue is ordered newest first and filtered by where a question
 * stands, because the only question that matters on opening this page is
 * "what has nobody answered yet". A note can be kept against any of them —
 * a draft of the answer, or the reason it was set aside — so the thinking
 * survives whoever was at the desk that day.
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

function ago(iso: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true })
  } catch {
    return iso
  }
}

export default function QuestionsPage() {
  const [key, setKey] = React.useState('')
  const [questions, setQuestions] = React.useState<Question[] | null>(null)
  const [filter, setFilter] = React.useState<QuestionStatus | 'all'>('new')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [busy, setBusy] = React.useState('')

  const load = async (event?: React.FormEvent) => {
    event?.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/questions', { headers: { Authorization: `Bearer ${key}` } })
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
  }

  /** One question changed — patch it in place rather than reloading the queue. */
  const patch = async (id: string, body: { status?: QuestionStatus; note?: string }) => {
    setBusy(id)
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
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
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${key}` },
      })
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
    <main className="shell pb-24 pt-10">
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

      <form onSubmit={load} className="mb-10 flex flex-wrap items-center gap-3">
        <Input
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="Posting key"
          className="max-w-[280px]"
          autoComplete="current-password"
        />
        <Button type="submit" disabled={loading || !key}>
          {loading ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
          {loading ? 'Opening' : 'Open the queue'}
        </Button>
        {error && <span className="text-[0.875rem] text-status-danger">{error}</span>}
      </form>

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
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
