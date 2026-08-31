'use client'

import * as React from 'react'
import { Bookmark, Heart } from 'lucide-react'
import { progressThrough } from '@/lib/read-insight'
import { FINISH_DEPTH, IDLE_AFTER_MS, hasFinished } from '@/lib/reading-rule'
import { remember, wasAsked } from '@/lib/liked'
import { useSaved } from '@/lib/saved'

/**
 * The one question a teaching asks its reader, at the end of it.
 *
 * Which question depends on how the reading went, and the site can now
 * tell the difference — that is what `lib/reading-rule.ts` bought. A
 * reader who reached the end of the writing *and* spent the time in it
 * has read the teaching, and the thing worth asking them is whether it
 * helped. A reader whose thumb carried them to the bottom in a few
 * seconds has not read it, and asking them whether they liked it would
 * be asking about something that did not happen — so they are offered
 * the thing they might actually want, which is to keep it for later.
 *
 * Asked once, ever, per teaching per browser. An invitation that comes
 * back every visit is not an invitation, it is nagging, and a reader
 * learns to dismiss it without reading it. See `lib/liked.ts`.
 *
 * Nothing here identifies anybody. A yes adds one to a number and says
 * nothing about who added it, and the record of having been asked never
 * leaves the device.
 *
 * ## Why it watches the page itself
 *
 * It keeps its own depth-and-seconds watch rather than sharing the
 * progress bar's. The bar is rendered above `<main>` and this sits at the
 * foot of the writing; wiring state between them would mean a provider
 * around the whole layout for one boolean. A second one-second interval
 * on a page that already runs three is the cheaper answer, and it keeps
 * this component something that can be dropped anywhere a teaching is
 * read — including the archive, where a teaching opens in place.
 */

/** Long enough that the offer follows the reading rather than interrupting it. */
const SETTLE_SECONDS = 4

type Asking = 'none' | 'like' | 'save'
type Answered = 'none' | 'liked' | 'saved' | 'dismissed'

export function ReadingPrompt({
  slug,
  readMinutes,
  targetId,
}: {
  slug: string
  readMinutes: number
  /** The element that is the writing, not the page it sits on. */
  targetId: string
}) {
  const [asking, setAsking] = React.useState<Asking>('none')
  const [answered, setAnswered] = React.useState<Answered>('none')
  const { toggle, isSaved } = useSaved()

  React.useEffect(() => {
    if (wasAsked(slug)) return

    let engaged = 0
    let lastActive = Date.now()
    let settled = false
    const stir = () => {
      lastActive = Date.now()
    }

    const look = () => {
      const node = document.getElementById(targetId)
      if (!node) return
      const box = node.getBoundingClientRect()
      const depth = progressThrough(
        { top: box.top, height: node.offsetHeight },
        window.scrollY,
        window.innerHeight
      )
      if (depth < FINISH_DEPTH) return

      /* Read, or merely arrived at the bottom. The rule decides, and it
         is the same rule the shelf and the counters use. */
      if (hasFinished(depth, engaged, readMinutes)) {
        setAsking('like')
        return
      }
      /* A flick. Give it a moment before offering anything, so the offer
         reads as a response to the reading rather than a reflex. */
      if (settled) setAsking('save')
    }

    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastActive > IDLE_AFTER_MS) return
      engaged += 1
      if (engaged >= SETTLE_SECONDS) settled = true
      look()
    }, 1000)

    const onScroll = () => {
      stir()
      look()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointerdown', stir, { passive: true })
    window.addEventListener('keydown', stir)
    return () => {
      window.clearInterval(tick)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointerdown', stir)
      window.removeEventListener('keydown', stir)
    }
  }, [slug, readMinutes, targetId])

  const close = (how: Answered, liked: boolean) => {
    remember(slug, liked)
    setAnswered(how)
    setAsking('none')
  }

  const like = () => {
    /* Sent and forgotten. The reader's answer is recorded on this device
       whatever the network does; a heart that fails to reach the server
       is a lost count, not a lost answer, and it must never be shown to
       them as an error. */
    void fetch('/api/likes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => undefined)
    close('liked', true)
  }

  const keep = () => {
    if (!isSaved(slug)) toggle(slug)
    close('saved', false)
  }

  if (answered !== 'none') {
    return (
      <p
        role="status"
        className="mt-10 text-center font-sans text-[0.9375rem] text-ink-500"
      >
        {answered === 'liked'
          ? 'Thank you. May the Lord bless the reading of it.'
          : answered === 'saved'
            ? 'Kept. It will be waiting on this device.'
            : null}
      </p>
    )
  }

  if (asking === 'none') return null

  const asksAboutLiking = asking === 'like'

  return (
    <aside
      className="mt-10 rounded-panel border border-rule bg-raised px-5 py-5 text-center sm:px-8"
      aria-live="polite"
    >
      <p className="font-display text-[1.125rem] leading-[1.35] text-navy sm:text-[1.25rem]">
        {asksAboutLiking
          ? 'Did this teaching help you?'
          : 'Would you like to keep this and read it properly later?'}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={asksAboutLiking ? like : keep}
          data-track={asksAboutLiking ? 'like-article' : 'keep-article'}
          className="focus-ring inline-flex items-center gap-2 rounded-chip bg-cta px-5 py-2.5 font-sans text-[0.9375rem] font-semibold text-cta-ink transition-colors hover:bg-cta-hover"
        >
          {asksAboutLiking ? (
            <Heart aria-hidden className="h-4 w-4" strokeWidth={2} />
          ) : (
            <Bookmark aria-hidden className="h-4 w-4" strokeWidth={2} />
          )}
          {asksAboutLiking ? 'Yes, it did' : 'Save it for later'}
        </button>
        <button
          type="button"
          onClick={() => close('dismissed', false)}
          className="focus-ring rounded-chip px-4 py-2.5 font-sans text-[0.9375rem] text-ink-500 transition-colors hover:text-navy"
        >
          No thank you
        </button>
      </div>
    </aside>
  )
}
