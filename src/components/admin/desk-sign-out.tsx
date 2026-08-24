'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

/**
 * Handing the session back.
 *
 * There was no way to do this before, because there was nothing to hand
 * back: the key lived in a form field and a refresh disposed of it. A
 * session outlives the tab, so somebody who used the desk on a borrowed
 * machine needs a way to end it that is not clearing site data.
 */
export function DeskSignOut() {
  const pathname = usePathname()
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)

  /* Nothing to sign out of at the door. */
  if (pathname === '/admin/login') return null

  const signOut = async () => {
    setBusy(true)
    try {
      await fetch('/api/desk/session', { method: 'DELETE' })
    } catch {
      /* The cookie may still be there, and the next request will be sent
         to the door anyway. Nothing useful to say about it here. */
    }
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div className="shell flex max-w-[64rem] justify-end pt-6">
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className="focus-ring inline-flex items-center gap-1.5 rounded-chip px-2 py-1 font-sans text-xs font-bold uppercase tracking-kicker text-ink-subtle transition-colors hover:text-gold disabled:opacity-50"
      >
        <LogOut aria-hidden className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  )
}
