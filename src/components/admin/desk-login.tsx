'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/**
 * The one place a desk key is typed.
 *
 * It does not ask which desk you are — the key says. Present the posting
 * key and you get the posting desk; present the review key and you get
 * that as well as everything the posting key reaches. Two doors would
 * only mean choosing one before you had proved anything, and choosing
 * wrong.
 */
export function DeskLogin({ from, need }: { from: string; need?: string }) {
  const router = useRouter()
  const [key, setKey] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!key.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/desk/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(body.error ?? `The desk returned ${response.status}.`)
        setBusy(false)
        return
      }
      /* Cleared before leaving, so the key is not sitting in a React tree
         a back button can bring back. */
      setKey('')
      router.replace(from)
      /* The gate is server-side; the client cache still holds the redirect
         it was given before there was a session. */
      router.refresh()
    } catch {
      setError('Could not reach the desk.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      {need === 'review' && (
        <p
          role="status"
          className="mb-5 rounded-2xl border border-hairline bg-surface px-4 py-3 font-sans text-sm leading-relaxed text-ink-muted"
        >
          That key writes, but it does not decide what goes on the site. The review desk needs the
          review key.
        </p>
      )}

      <label
        htmlFor="desk-key"
        className="font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted"
      >
        Key
      </label>
      <div className="relative mt-2">
        <KeyRound
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
        />
        <Input
          id="desk-key"
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="Posting key, or review key"
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'desk-key-error' : undefined}
          className="pl-10"
        />
      </div>

      {error && (
        <p id="desk-key-error" role="alert" className="mt-3 font-sans text-sm text-status-danger">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy || !key.trim()} className="mt-5 w-full">
        {busy ? (
          <>
            <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" />
            Checking
          </>
        ) : (
          'Open the desk'
        )}
      </Button>
    </form>
  )
}
