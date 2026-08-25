'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardCheck, Feather, LogOut, MessageCircleQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The bar across the top of every desk.
 *
 * There was none. Each desk opened straight onto its own heading with a
 * sign-out button floating above it, which meant three things: no page
 * said which part of the ministry's own tooling you were in, there was
 * no way between the desks except the browser's back button and one
 * breadcrumb, and the whole thing read as a page someone had been sent
 * rather than a place they worked.
 *
 * The reader-facing site solves the same problem with a masthead — seal,
 * wordmark, sections, a gold rule closing the bar — and the desk should
 * be recognisably the same building. It is not the reader's masthead
 * though: this is the back of house, so it says so plainly and carries
 * the desks instead of the sections.
 *
 * Which desks appear depends on the key that opened the door. A writer
 * shown a link to the review desk would be shown the door by the
 * middleware a moment later, which is a worse answer than not offering
 * it: navigation that leads somewhere you may not go is navigation that
 * has to be apologised for.
 */

interface Desk {
  href: string
  label: string
  icon: typeof Feather
  /** Only a reviewer sees these. */
  review?: boolean
}

const DESKS: Desk[] = [
  { href: '/admin', label: 'Write', icon: Feather },
  { href: '/admin/review', label: 'Review', icon: ClipboardCheck, review: true },
  { href: '/admin/questions', label: 'Questions', icon: MessageCircleQuestion, review: true },
]

export function DeskHeader() {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const [role, setRole] = React.useState<'writer' | 'reviewer' | null>(null)
  const [who, setWho] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const response = await fetch('/api/desk/me')
        if (!response.ok) return
        const payload = (await response.json()) as {
          role: 'writer' | 'reviewer'
          writer: { name: string } | null
        }
        if (!alive) return
        setRole(payload.role)
        setWho(payload.writer?.name ?? null)
      } catch {
        /* The bar is navigation, not a gate. If this cannot be answered
           the desks simply do not list until it can. */
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const signOut = async () => {
    setBusy(true)
    try {
      await fetch('/api/desk/session', { method: 'DELETE' })
    } catch {
      /* The next request is sent to the door regardless. */
    }
    router.replace('/admin/login')
    router.refresh()
  }

  /* Nothing to navigate, and nothing to sign out of, at the door. */
  if (pathname === '/admin/login') return null

  const open = DESKS.filter((desk) => !desk.review || role === 'reviewer')

  return (
    <header className="sticky top-0 z-50 border-b border-gold/60 bg-raised/95 backdrop-blur">
      <div className="shell flex h-14 max-w-[64rem] items-center gap-4 px-5 sm:px-8">
        <Link
          href="/admin"
          className="focus-ring flex shrink-0 items-center gap-2.5 rounded-md"
          aria-label="The desk"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md bg-plate font-display text-[0.8125rem] font-semibold leading-none text-plate-pale"
          >
            R
          </span>
          <span className="font-display text-sm font-semibold leading-none text-ink-strong">
            The desk
          </span>
        </Link>

        <nav aria-label="Desks" className="ml-2 flex min-w-0 flex-1 items-center gap-1">
          {open.map((desk) => {
            /* `/admin` is the writing desk itself, not a parent of the
               others, so it matches exactly where the rest match their
               own subtrees. */
            const here =
              desk.href === '/admin' ? pathname === '/admin' : pathname.startsWith(desk.href)
            const Icon = desk.icon
            return (
              <Link
                key={desk.href}
                href={desk.href}
                aria-current={here ? 'page' : undefined}
                className={cn(
                  'focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-sans text-[0.8125rem] font-semibold transition-colors',
                  here
                    ? 'bg-chip-gold/60 text-gold-ink'
                    : 'text-ink-muted hover:bg-surface hover:text-ink-strong'
                )}
              >
                <Icon aria-hidden className="h-[0.9375rem] w-[0.9375rem]" strokeWidth={1.9} />
                <span className="hidden sm:inline">{desk.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Who is at the desk, where a person expects to find it. The
            ministry's own keys belong to nobody in particular and say so
            rather than inventing a name. */}
        {role && (
          <span className="hidden shrink-0 items-center gap-2 md:inline-flex">
            <span className="font-sans text-[0.8125rem] text-ink-muted">
              {who ?? 'The ministry'}
            </span>
            <span
              className="desk-chip border-hairline bg-surface text-ink-subtle"
              title={role === 'reviewer' ? 'May approve what goes on the site' : 'May write and submit'}
            >
              {role === 'reviewer' ? 'Reviewer' : 'Writer'}
            </span>
          </span>
        )}

        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="focus-ring icon-only inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 font-sans text-xs font-bold uppercase tracking-kicker text-ink-subtle transition-colors hover:text-gold disabled:opacity-50"
        >
          <LogOut aria-hidden className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
