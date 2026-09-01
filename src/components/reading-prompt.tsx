'use client'

import * as React from 'react'
import { Heart } from 'lucide-react'
import { progressThrough } from '@/lib/read-insight'
import { FINISH_DEPTH, IDLE_AFTER_MS, reachedTheEnd } from '@/lib/reading-rule'
import { remember, wasAsked } from '@/lib/liked'

/**
 * The one question a teaching asks its reader, at the end of it.
 *
 * One question: whether it helped. Asked when the reader reaches the end
 * of the writing, which is the moment they are most likely to know.
 *
 * ## Why there is no longer a second question
 *
 * This asked two, and chose between them by how fast the reader got to
 * the bottom: reach the end slowly and you were asked about the
 * teaching, reach it quickly and you were offered a bookmark instead, on
 * the grounds that you had not really read it.
 *
 * The judgement could not be made well enough to act on. A six-minute
 * teaching scrolled through in nine seconds is indistinguishable, from
 * here, from a reader who skims fast and reads carefully — and the cost
 * of getting it wrong is not symmetric. Offering a bookmark to somebody
 * who has just finished reads as the page not having noticed. Waiting
 * to be sure meant the question changed under them, from a bookmark to a
 * heart, which reads as the page changing its mind.
 *
 * So the offer follows the scrollbar and nothing else, and keeping a
 * teaching for later moved to where it belongs: a button that is always
 * there, in the row at the foot — see `ShareRow`. A control a reader can
 * find beats a guess about what they meant.
 *
 * The statistics are untouched by any of this. `hasFinished` still asks
 * for the clock as well as the scrollbar, because a count that treats a
 * flick as a reading lies to the ministry about its own work. An offer
 * of a heart has no such duty: the worst case of asking a skimmer is
 * that they ignore it, and the worst case of not asking a fast reader is
 * a real reader silently refused.
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

type Answered = 'none' | 'liked' | 'dismissed'

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
  const [asking, setAsking] = React.useState(false)
  const [answered, setAnswered] = React.useState<Answered>('none')

  React.useEffect(() => {
    if (wasAsked(slug)) return

    let engaged = 0
    let lastActive = Date.now()
    let asked = false
    const stir = () => {
      lastActive = Date.now()
    }

    const look = () => {
      if (asked) return
      const node = document.getElementById(targetId)
      if (!node) return
      const box = node.getBoundingClientRect()
      const depth = progressThrough(
        { top: box.top, height: node.offsetHeight },
        window.scrollY,
        window.innerHeight
      )
      /* The end of the writing, plus enough seconds to rule out a page
         that was scrolled past on the way somewhere else. */
      if (!reachedTheEnd(depth, engaged)) return
      asked = true
      setAsking(true)
    }

    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastActive > IDLE_AFTER_MS) return
      engaged += 1
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
    setAsking(false)
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

  if (answered !== 'none') {
    return (
      <p
        role="status"
        className="mt-10 text-center font-sans text-[0.9375rem] text-ink-500"
      >
        {answered === 'liked' ? 'Thank you. May the Lord bless the reading of it.' : null}
      </p>
    )
  }

  if (!asking) return null

  return (
    <aside
      className="mt-10 rounded-panel border border-rule bg-raised px-5 py-5 text-center sm:px-8"
      aria-live="polite"
    >
      <p className="font-display text-[1.125rem] leading-[1.35] text-navy sm:text-[1.25rem]">
        Did this teaching help you?
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={like}
          data-track="like-article"
          className="focus-ring inline-flex items-center gap-2 rounded-chip bg-cta px-5 py-2.5 font-sans text-[0.9375rem] font-semibold text-cta-ink transition-colors hover:bg-cta-hover"
        >
          <Heart aria-hidden className="h-4 w-4" strokeWidth={2} />
          Yes, it did
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
