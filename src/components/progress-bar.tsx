'use client'

import * as React from 'react'
import { mark } from '@/lib/reading-progress'
import { IDLE_AFTER_MS } from '@/lib/reading-rule'

/**
 * Thin gold reading-progress bar pinned to the very top of the viewport.
 *
 * It also remembers. Given the piece it is standing on, the same scroll
 * position that draws the bar is written to this browser so the archive
 * can offer the reader their way back into it. Nothing leaves the machine
 * — see reading-progress.ts.
 */
/**
 * How far through a block a reader has scrolled, 0–1.
 *
 * From where the block's top meets the top of the window to where its
 * bottom meets the bottom of it. Pulled out of the component and given
 * plain numbers because it is the whole of what "how much have I read"
 * means on this site, and a number that can only be checked by scrolling
 * a real browser is a number nobody checks.
 */
export function progressThrough({
  top,
  height,
  scrollY,
  viewport,
}: {
  /** The block's distance from the top of the document. */
  top: number
  height: number
  scrollY: number
  viewport: number
}): number {
  const run = height - viewport
  /* A block shorter than the window has no scroll of its own. It used to
     report zero forever, which meant a short teaching could be read end
     to end and never recorded — so it is read once the whole of it has
     been on screen. */
  if (run <= 0) return scrollY + viewport >= top + height ? 1 : 0
  return Math.min(1, Math.max(0, (scrollY - top) / run))
}

/**
 * How much of a teaching is left, in minutes.
 *
 * The bar says how far a reader has come, which is the past and is not a
 * thing anybody is deciding about. What they are deciding is whether to
 * carry on, and that turns on what it costs — so the number to show is
 * the one that answers it.
 *
 * Rounded up, and never to zero while there is anything left: "1 min
 * left" on the last stretch is honest, and "0 min left" in front of three
 * remaining paragraphs is the site telling a reader something they can
 * see is untrue.
 */
export function minutesLeft(readMinutes: number, progress: number): number {
  const left = readMinutes * (1 - Math.min(1, Math.max(0, progress)))
  return Math.max(1, Math.ceil(left))
}

/**
 * Whether the number is worth showing at all.
 *
 * Not at the top, where it would be the reading time the piece already
 * prints under its own headline, said again in a floating label. Not at
 * the end, where a reader a paragraph from finishing does not need to be
 * told to keep going — and where a badge would sit over the last lines
 * of the teaching. In between, where somebody is actually deciding.
 */
export function showsTimeLeft(progress: number): boolean {
  return progress > 0.06 && progress < 0.93
}

export function ReadingProgress({
  piece,
  target,
  targetId,
}: {
  /** Omitted on a page that is not a piece; then the bar only draws. */
  piece?: { slug: string; title: string; href: string; readMinutes: number }
  /**
   * The element being read, when it is not the whole page — on the archive
   * the teaching is one block inside a listing, and a bar measuring the
   * page would report a reader as finished while they were still in the
   * second paragraph.
   */
  target?: React.RefObject<HTMLElement>
  /**
   * The same thing, named rather than handed over.
   *
   * A teaching's own page is rendered on the server and has no ref to
   * give, so it measured the document instead — which is not the
   * teaching. Measured on "Why does God allow suffering?" at 1440×900:
   * the writing is 9,019px of a 13,134px document, with 3,768px of Read
   * Next, rails, the ask-a-question section and the footer after its last
   * line. So a reader halfway through the writing was recorded at 36%,
   * the last line of it came to 69%, and the finished mark at 95% could
   * not be reached by reading at all — only by scrolling on past the
   * question form to the foot of the page, where the mark was then thrown
   * away for being finished.
   */
  targetId?: string
}) {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    let frame = 0
    /* Resolved on each pass rather than held: the named element belongs to
       a server-rendered page and is there from the first paint, but the
       ref's does not exist until its own component has mounted. */
    const measured = (): HTMLElement | null =>
      target?.current ?? (targetId ? document.getElementById(targetId) : null)

    const update = () => {
      const element = measured()
      if (element) {
        const box = element.getBoundingClientRect()
        setProgress(
          progressThrough({
            top: box.top + window.scrollY,
            height: element.offsetHeight,
            scrollY: window.scrollY,
            viewport: window.innerHeight,
          })
        )
        return
      }
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(1, window.scrollY / total) : 0)
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    /* The block grows as its body arrives, and again as images land. */
    const watched = measured()
    const observer = watched ? new ResizeObserver(onScroll) : null
    if (observer && watched) observer.observe(watched)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [target, targetId])

  /* Written on the way out rather than on every frame: a reader scrolling
     a long teaching would otherwise touch localStorage a hundred times a
     second. `pagehide` fires where `beforeunload` does not on a phone. */
  const latest = React.useRef(progress)
  latest.current = progress

  /* Engaged seconds, on the same terms the ministry's own counters use:
     time while the tab is visible and the reader has done something
     recently, and no other time at all. A tab left open overnight adds
     nothing, which is the whole reason this is not a wall clock.

     `saved` is a ledger of what has already been written, so each second
     is sent to the shelf exactly once — `mark` adds what it is given to
     what it holds, and this effect can save three times on the way out
     of a page. */
  const engaged = React.useRef(0)
  const saved = React.useRef(0)

  React.useEffect(() => {
    if (!piece) return
    let lastActive = Date.now()
    const stir = () => {
      lastActive = Date.now()
    }

    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastActive > IDLE_AFTER_MS) return
      engaged.current += 1
    }, 1000)

    const save = () => {
      const unsent = Math.max(0, engaged.current - saved.current)
      saved.current = engaged.current
      mark({ ...piece, progress: latest.current, seconds: unsent })
    }

    window.addEventListener('scroll', stir, { passive: true })
    window.addEventListener('pointerdown', stir, { passive: true })
    window.addEventListener('keydown', stir)
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', save)
    return () => {
      save()
      window.clearInterval(tick)
      window.removeEventListener('scroll', stir)
      window.removeEventListener('pointerdown', stir)
      window.removeEventListener('keydown', stir)
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', save)
    }
  }, [piece])

  /* The bar draws, and nothing else. It used to float a "N min left"
     badge in the top-right corner as well — an answer to "how far in am
     I" sitting on its own in a corner, unrelated to the chapter list
     answering the other half of the same question somewhere else
     entirely. Both are in the chapter strip now, which is where a reader
     looks when they ask. `minutesLeft` and `showsTimeLeft` are still
     here, and still the rule; the strip imports them. */
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent">
      <div
        className="h-full bg-gold transition-[width] duration-100 ease-linear"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
}
