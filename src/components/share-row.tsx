'use client'

import * as React from 'react'
import { Check, Link2, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/brand-icons'

const pill =
  'focus-ring inline-flex h-10 items-center gap-2 rounded-chip border border-rule bg-card px-4 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-muted transition-colors hover:border-gold hover:text-navy'

/** Share bar for article pages: WhatsApp first — it is the distribution channel. */
export function ShareRow({ title, className }: { title: string; className?: string }) {
  const [copied, setCopied] = React.useState(false)
  const [canNativeShare, setCanNativeShare] = React.useState(false)

  React.useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && Boolean(navigator.share))
  }, [])

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
      <button type="button" onClick={shareWhatsApp} className={cn(pill, 'hover:border-[#25D366]/70 hover:text-[#25D366]')}>
        <WhatsAppIcon className="h-4 w-4" />
        WhatsApp
      </button>
      {canNativeShare && (
        <button type="button" onClick={shareNative} className={pill}>
          <Share2 className="h-4 w-4" />
          Share
        </button>
      )}
      <button type="button" onClick={copyLink} className={pill} aria-live="polite">
        {copied ? <Check className="h-4 w-4 text-fulfilled" /> : <Link2 className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}
