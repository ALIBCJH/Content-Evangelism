'use client'

import * as React from 'react'
import Link from 'next/link'
import { Copy, ExternalLink, KeyRound, LoaderCircle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { dated } from './format'

/**
 * The people who write here, and the keys that let them.
 *
 * The ministry had one key everybody shared, which meant nothing could
 * say who wrote or approved anything, removing one person meant changing
 * everybody's key, and a byline was a box somebody typed their own name
 * into — differently each time. A writer is a record now, with a key of
 * their own and a page of their own.
 *
 * A key is shown once, here, at the moment it is made. It is not stored:
 * what the registry holds is a salt and a scrypt hash, so nothing in it
 * opens the desk and nothing can hand the key back. Somebody who loses
 * theirs is given a new one, which is a smaller thing than a store that
 * could return the old.
 */

export interface DeskWriter {
  id: string
  name: string
  role: string
  bio: string
  canReview: boolean
  active: boolean
  addedAt: string
  pendingProfile?: { role: string; bio: string; at: string }
}

/** The one moment a key is readable. Dismissed rather than kept. */
function KeyOnce({ name, value, onDone }: { name: string; value: string; onDone: () => void }) {
  const [copied, setCopied] = React.useState(false)

  return (
    <div className="rounded-2xl border border-gold/50 bg-chip-gold/30 p-5">
      <p className="kicker text-gold-ink">{name}&rsquo;s key</p>
      <p className="mt-2 font-sans text-sm leading-relaxed text-ink-strong">
        Give this to them now. It is not stored anywhere and cannot be shown again — if it is lost,
        make them a new one.
      </p>
      <code className="mt-3 block overflow-x-auto rounded-xl border border-hairline bg-surface px-4 py-3 font-mono text-sm text-ink">
        {value}
      </code>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value)
              setCopied(true)
            } catch {
              /* No clipboard permission. It is on the screen to be read. */
            }
          }}
        >
          <Copy />
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <button
          type="button"
          onClick={onDone}
          className="focus-ring font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
        >
          I have given it to them
        </button>
      </div>
    </div>
  )
}

export function WritersBand() {
  const [writers, setWriters] = React.useState<DeskWriter[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [minted, setMinted] = React.useState<{ name: string; key: string } | null>(null)
  const [adding, setAdding] = React.useState(false)

  const [name, setName] = React.useState('')
  const [role, setRole] = React.useState('')
  const [bio, setBio] = React.useState('')
  const [canReview, setCanReview] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const response = await fetch('/api/desk/writers', { cache: 'no-store' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) setError(body.error ?? 'Could not read the register.')
      else setWriters(body.writers as DeskWriter[])
    } catch {
      setError('Could not reach the desk.')
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const add = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy('add')
    setError(null)
    try {
      const response = await fetch('/api/desk/writers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, bio, canReview }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) setError(body.error ?? 'That did not go through.')
      else {
        setMinted({ name: body.writer.name, key: body.key })
        setName('')
        setRole('')
        setBio('')
        setCanReview(false)
        setAdding(false)
        await load()
      }
    } catch {
      setError('Could not reach the desk.')
    }
    setBusy(null)
  }

  const act = async (id: string, action: string, name?: string) => {
    if (action === 'deactivate' && !window.confirm(`Turn off ${name}'s key? Their page and everything they have written stay.`)) {
      return
    }
    setBusy(id)
    setError(null)
    try {
      const response = await fetch(`/api/desk/writers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) setError(body.error ?? 'That did not go through.')
      else {
        if (body.key) setMinted({ name: name ?? id, key: body.key })
        await load()
      }
    } catch {
      setError('Could not reach the desk.')
    }
    setBusy(null)
  }

  const waiting = (writers ?? []).filter((writer) => writer.pendingProfile)

  return (
    <section aria-labelledby="band-writers">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="band-writers" className="font-display text-xl text-ink-strong">
            Who writes here
            {writers && (
              <span className="tabular ml-3 font-sans text-sm text-ink-subtle">
                {writers.length}
              </span>
            )}
          </h2>
          <p className="mt-2 max-w-prose font-sans text-sm leading-relaxed text-ink-muted">
            Each writer signs in with a key of their own, and everything they write carries their
            name and leads to their page. Turning a key off ends their access; their name stays on
            what they wrote.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAdding((was) => !was)}>
          <UserPlus />
          {adding ? 'Close' : 'Add a writer'}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-4 font-sans text-sm text-status-danger">
          {error}
        </p>
      )}

      {minted && (
        <div className="mt-4">
          <KeyOnce name={minted.name} value={minted.key} onDone={() => setMinted(null)} />
        </div>
      )}

      {adding && (
        <form onSubmit={add} className="mt-4 space-y-4 desk-card p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="w-name" className="kicker block text-ink-subtle">
                Name, as it should appear on a byline
              </label>
              <Input
                id="w-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Simon Juma"
                className="mt-2"
                required
              />
            </div>
            <div>
              <label htmlFor="w-role" className="kicker block text-ink-subtle">
                What they do here
              </label>
              <Input
                id="w-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Devotional Editor"
                className="mt-2"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="w-bio" className="kicker block text-ink-subtle">
              About them
            </label>
            <textarea
              id="w-bio"
              rows={3}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="A sentence or two a reader would want to know about who wrote this."
              className="focus-ring mt-2 w-full rounded-2xl border border-hairline-strong bg-surface px-5 py-4 font-serif text-base leading-relaxed text-ink placeholder:text-ink-subtle transition-colors focus:border-gold/60"
              required
            />
            <p className="mt-1.5 font-sans text-xs text-ink-subtle">
              They can rewrite this themselves later; it comes back here for approval.
            </p>
          </div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={canReview}
              onChange={(event) => setCanReview(event.target.checked)}
              className="focus-ring mt-1 h-4 w-4 rounded border-hairline-strong"
            />
            <span className="font-sans text-sm text-ink-muted">
              <span className="font-semibold text-ink-strong">They may also approve.</span> Their key
              opens this board and decides what goes on the site. Leave it off for somebody who
              writes.
            </span>
          </label>
          <Button type="submit" disabled={busy === 'add'}>
            {busy === 'add' && <LoaderCircle className="animate-spin" />}
            Add them, and make a key
          </Button>
        </form>
      )}

      {/* Somebody has rewritten their own page and it is not on the site
          until this is dealt with. Above the register, because it is the
          only part of it waiting on the reviewer. */}
      {waiting.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {waiting.map((writer) => (
            <li key={writer.id} className="rounded-2xl border border-gold/40 bg-chip-gold/30 p-5">
              <p className="kicker text-gold-ink">
                {writer.name} has rewritten their page · {dated(writer.pendingProfile?.at)}
              </p>
              <p className="mt-2 font-sans text-sm font-semibold text-ink-strong">
                {writer.pendingProfile?.role}
              </p>
              <p className="mt-1 font-sans text-sm leading-relaxed text-ink-muted">
                {writer.pendingProfile?.bio}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button
                  size="sm"
                  disabled={busy === writer.id}
                  onClick={() => act(writer.id, 'approve-profile', writer.name)}
                >
                  Put it on their page
                </Button>
                <button
                  type="button"
                  disabled={busy === writer.id}
                  onClick={() => act(writer.id, 'refuse-profile', writer.name)}
                  className="focus-ring font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-status-danger"
                >
                  Leave the page as it is
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {writers === null ? (
        <p className="mt-4 flex items-center gap-2 font-sans text-sm text-ink-muted">
          <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
          Reading the register…
        </p>
      ) : writers.length === 0 ? (
        <p className="mt-4 desk-card px-5 py-6 font-sans text-sm leading-relaxed text-ink-muted">
          Nobody has a desk of their own yet. Everything is written with the ministry&rsquo;s own
          keys, which means the archive cannot say who wrote what. Add a writer and they get a key,
          a byline and a page.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-hairline desk-card">
          {writers.map((writer) => (
            <li key={writer.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-sans text-sm font-semibold text-ink-strong">
                  {writer.name}
                  {writer.canReview && (
                    <span className="ml-2 rounded-chip bg-gold/15 px-2 py-0.5 font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-gold">
                      Approves
                    </span>
                  )}
                  {!writer.active && (
                    <span className="ml-2 font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-ink-subtle">
                      Key off
                    </span>
                  )}
                </p>
                <p className="mt-0.5 font-sans text-xs text-ink-subtle">
                  {writer.role} · added {dated(writer.addedAt)}
                </p>
              </div>

              <Link
                href={`/authors/${writer.id}`}
                className="focus-ring inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-kicker text-ink-subtle transition-colors hover:text-gold"
              >
                Their page
                <ExternalLink aria-hidden className="h-3 w-3" />
              </Link>

              <button
                type="button"
                disabled={busy === writer.id}
                onClick={() => act(writer.id, 'new-key', writer.name)}
                className="focus-ring inline-flex items-center gap-1.5 rounded-chip border border-hairline px-3 py-1.5 font-sans text-xs font-semibold text-ink-muted transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40"
              >
                <KeyRound aria-hidden className="h-3.5 w-3.5" />
                New key
              </button>

              <button
                type="button"
                disabled={busy === writer.id}
                onClick={() => act(writer.id, writer.active ? 'deactivate' : 'activate', writer.name)}
                className={`focus-ring font-sans text-xs font-bold uppercase tracking-kicker transition-colors disabled:opacity-40 ${
                  writer.active
                    ? 'text-ink-subtle hover:text-status-danger'
                    : 'text-gold hover:text-gold-light'
                }`}
              >
                {writer.active ? 'Turn key off' : 'Turn key on'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
