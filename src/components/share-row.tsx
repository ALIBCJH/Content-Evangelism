'use client'

import * as React from 'react'
import { Bookmark, Check, Heart, Link2, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/brand-icons'
import { remember, wasLiked } from '@/lib/liked'
import { useSaved } from '@/lib/saved'

const pill =
  'focus-ring inline-flex h-10 items-center gap-2 rounded-chip border border-rule bg-card px-4 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-muted transition-colors hover:border-gold hover:text-navy'

/**
 * What a reader can do with a teaching, in one row at the foot of it.
 *
 * It was three share buttons. It now opens with the two things a reader
 * does about the teaching rather than about sending it on — say it
 * helped, and keep it — because the site was asking both of those
 * questions in a prompt after the reading and offering no way to answer
 * them at any other moment. A reader who wanted to say yes before
 * reaching the end, or who dismissed the prompt and changed their mind,
 * had nowhere to go.
 *
 * The prompt stays. The two are not duplicates: this is a control that is
 * always there for anybody looking for it, and that is an invitation
 * offered once to somebody who has just finished. They share one memory,
 * so a teaching liked here is not asked about afterwards and vice versa.
 *
 * `slug` is what turns the row from a share bar into this. Without it —
 * anywhere that is not a teaching — it is the share bar it always was.
 */
export function ShareRow({
  title,
  slug,
  likes = 0,
  className,
}: {
  title: string
  /** The teaching, where this is on one. Absent elsewhere. */
  slug?: string
  /** What the store already holds, rendered before this reader adds to it. */
  likes?: number
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)
  const [canNativeShare, setCanNativeShare] = React.useState(false)
  /* Two flags rather than one, because the count depends on which is
     true. A browser that said yes on a previous visit is already in the
     number the server sent; a browser saying yes now is not, and the
     number has to move under their finger — the listing will not catch
     up for five minutes. */
  const [alreadyLiked, setAlreadyLiked] = React.useState(false)
  const [justLiked, setJustLiked] = React.useState(false)
  const liked = alreadyLiked || justLiked
  const { toggle, isSaved, ready } = useSaved()

  React.useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && Boolean(navigator.share))
    if (slug) setAlreadyLiked(wasLiked(slug))
  }, [slug])

  const shown = likes + (justLiked ? 1 : 0)

  const like = () => {
    if (!slug || liked) return
    setJustLiked(true)
    remember(slug, true)
    void fetch('/api/likes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => undefined)
  }

  const url = () => window.location.href

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${title} — ${url()}`)}`,
      '_blank',
      'noopener'
    )
  }

  const shareNative = async () => {
    try {
      await navigator.share({ title, url: url() })
    } catch {
      // User dismissed the sheet — nothing to do.
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-3', className)}>
      {slug && (
        <>
          <button
            type="button"
            onClick={like}
            aria-pressed={liked}
            data-track="like-article"
            className={cn(
              pill,
              liked && 'border-gold/70 text-gold-ink',
              !liked && 'hover:border-gold/70'
            )}
          >
            <Heart
              aria-hidden
              className="h-4 w-4"
              strokeWidth={2}
              fill={liked ? 'currentColor' : 'none'}
            />
            {liked ? 'Thank you' : 'It helped me'}
            {shown > 0 && <span className="tabular ml-0.5">{shown}</span>}
          </button>

          <button
            type="button"
            onClick={() => toggle(slug)}
            aria-pressed={ready && isSaved(slug)}
            data-track="save-article"
            className={cn(pill, ready && isSaved(slug) && 'border-gold/70 text-gold-ink')}
          >
            <Bookmark
              aria-hidden
              className="h-4 w-4"
              strokeWidth={2}
              fill={ready && isSaved(slug) ? 'currentColor' : 'none'}
            />
            {ready && isSaved(slug) ? 'Kept' : 'Keep it'}
          </button>
        </>
      )}

      <button type="button" onClick={shareWhatsApp} data-track="share-article" className={cn(pill, 'hover:border-[#25D366]/70 hover:text-[#25D366]')}>
        <WhatsAppIcon className="h-4 w-4" />
        WhatsApp
      </button>
      {canNativeShare && (
        <button type="button" onClick={shareNative} data-track="share-article" className={pill}>
          <Share2 className="h-4 w-4" />
          Share
        </button>
      )}
      <button type="button" onClick={copyLink} data-track="share-article" className={pill} aria-live="polite">
        {copied ? <Check className="h-4 w-4 text-fulfilled" /> : <Link2 className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}
