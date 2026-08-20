import Link from 'next/link'
import { newTeachingsChannel } from '@/lib/content'
import { WhatsAppIcon } from '@/components/brand-icons'

/**
 * The way to be told that a teaching has been published.
 *
 * Deliberately not a form. An email list means addresses to hold, consent
 * to record, and a promise to keep about both; a channel link means a
 * reader follows on the app they already have, and this site never learns
 * who they are.
 *
 * Nothing renders when no channel is configured, because the alternative
 * is a door with nothing behind it.
 */
export function FollowChannel({ className = '' }: { className?: string }) {
  if (!newTeachingsChannel) return null

  return (
    <Link
      href={newTeachingsChannel}
      target="_blank"
      rel="noopener noreferrer"
      data-track="follow-channel"
      className={`focus-ring group inline-flex items-center gap-2.5 rounded-chip border border-rule bg-card px-4 py-2.5 text-[0.9375rem] text-ink transition-colors hover:border-[#25D366]/60 hover:text-[#128C7E] ${className}`}
    >
      <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
      <span>
        New teachings on WhatsApp
      </span>
    </Link>
  )
}
