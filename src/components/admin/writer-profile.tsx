'use client'

import * as React from 'react'
import Link from 'next/link'
import { ExternalLink, LoaderCircle, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * The words the site uses about a writer, edited by the writer.
 *
 * An author page is most of what Google reads to decide whether a byline
 * is a real person, and it is the first thing a reader who liked a
 * teaching looks for. Until now it came from a table of four names
 * written into the repository, so a new writer had a byline and nowhere
 * for it to lead.
 *
 * What is written here waits for the review desk, exactly as a teaching
 * does. The name is not editable: it is who they are rather than what
 * they say about themselves, and changing it would move their author page
 * out from under every link to it.
 */

export interface MeWriter {
  id: string
  name: string
  role: string
  bio: string
  pendingProfile?: { role: string; bio: string; at: string }
}

export function WriterProfile({ writer, onSaved }: { writer: MeWriter; onSaved: () => void }) {
  const waiting = writer.pendingProfile
  const [open, setOpen] = React.useState(false)
  const [role, setRole] = React.useState(waiting?.role ?? writer.role)
  const [bio, setBio] = React.useState(waiting?.bio ?? writer.bio)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/desk/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, bio }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) setError(body.error ?? 'That did not save.')
      else {
        setDone(true)
        setOpen(false)
        onSaved()
      }
    } catch {
      setError('Could not reach the desk.')
    }
    setBusy(false)
  }

  return (
    <section className="desk-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="kicker text-ink-subtle">Your page</p>
          <p className="mt-2 flex items-center gap-2 font-display text-lg font-semibold text-ink-strong">
            <UserRound aria-hidden className="h-4 w-4 text-gold" />
            {writer.name}
          </p>
          <p className="mt-1 font-sans text-sm text-ink-muted">{writer.role}</p>
          <Link
            href={`/authors/${writer.id}`}
            className="focus-ring mt-2 inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-kicker text-ink-subtle transition-colors hover:text-gold"
          >
            /authors/{writer.id}
            <ExternalLink aria-hidden className="h-3 w-3" />
          </Link>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen((was) => !was)}>
          {open ? 'Close' : 'Edit your page'}
        </Button>
      </div>

      {/* Said whether or not the editor is open: somebody who proposed a
          change yesterday should not have to open a panel to find out it
          is still sitting there. */}
      {waiting && !done && (
        <p className="mt-4 rounded-xl border border-gold/40 bg-chip-gold/30 px-4 py-3 font-sans text-sm text-ink-strong">
          A change to your page is waiting for the review desk. What is on the site is still the
          wording above.
        </p>
      )}
      {done && (
        <p className="mt-4 rounded-xl border border-gold/40 bg-chip-gold/30 px-4 py-3 font-sans text-sm text-ink-strong">
          Sent to the review desk. It goes on your page when they approve it.
        </p>
      )}

      {open && (
        <div className="mt-5 space-y-4 border-t border-hairline pt-5">
          <div>
            <label htmlFor="me-role" className="kicker block text-ink-subtle">
              What you do here
            </label>
            <Input
              id="me-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Devotional Editor"
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="me-bio" className="kicker block text-ink-subtle">
              About you
            </label>
            <textarea
              id="me-bio"
              rows={4}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="A sentence or two a reader would want to know about who wrote this."
              className="focus-ring mt-2 w-full rounded-2xl border border-hairline-strong bg-surface px-5 py-4 font-serif text-base leading-relaxed text-ink placeholder:text-ink-subtle transition-colors focus:border-gold/60"
            />
            <p className="mt-1.5 font-sans text-xs text-ink-subtle">
              This is what a reader sees on your page, and most of what a search engine reads to
              decide the byline is a real person.
            </p>
          </div>

          {error && (
            <p role="alert" className="font-sans text-sm text-status-danger">
              {error}
            </p>
          )}

          <Button onClick={save} disabled={busy || role.trim().length < 2 || bio.trim().length < 20}>
            {busy && <LoaderCircle className="animate-spin" />}
            Send to the review desk
          </Button>
        </div>
      )}
    </section>
  )
}
