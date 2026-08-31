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
      className={`focus-ring group inline-flex items-center gap-1.5 text-xs text-ink-500 transition-colors hover:text-[#128C7E] ${className}`}
    >
      <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 text-[#25D366]" />
      <span>
        New teachings on WhatsApp
      </span>
    </Link>
  )
}
