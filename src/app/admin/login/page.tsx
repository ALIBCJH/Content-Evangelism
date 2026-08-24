import type { Metadata } from 'next'
import Link from 'next/link'
import { DeskLogin } from '@/components/admin/desk-login'
import { safeDeskReturn } from '@/lib/desk-session'

/**
 * The door.
 *
 * The only page under /admin the middleware lets through unopened, and
 * the only one that renders anything to somebody without a session.
 */
export const metadata: Metadata = {
  title: 'Sign in · The Desk',
  robots: { index: false, follow: false },
}

/* A session is checked on every request; a cached door would be shown to
   somebody who already has one. */
export const dynamic = 'force-dynamic'

export default function DeskLoginPage({
  searchParams,
}: {
  searchParams: { from?: string; need?: string }
}) {
  return (
    <main className="shell flex min-h-screen max-w-[26rem] flex-col justify-center pb-24 pt-16">
      <p className="kicker mb-4 text-ink-subtle">The desk</p>
      <h1 className="font-display text-3xl font-semibold text-ink-strong">Sign in</h1>
      <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
        The posting desk and the review desk are behind their own keys. Enter yours and you will be
        taken to what it opens.
      </p>

      <div className="mt-8">
        <DeskLogin from={safeDeskReturn(searchParams.from)} need={searchParams.need} />
      </div>

      <p className="mt-8 font-sans text-sm text-ink-subtle">
        <Link href="/" className="transition-colors hover:text-gold">
          Back to the site
        </Link>
      </p>
    </main>
  )
}
