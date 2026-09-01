'use client'

import * as React from 'react'
import type { Heading } from '@/lib/toc'

/**
 * What the teaching being read is made of, so the rail can say it.
 *
 * The sections rail lives in the reader layout, which sits above every
 * page and knows nothing about any of them. The chapters of a teaching
 * are known only to the teaching. Something has to carry them across, and
 * the choice is between threading a context provider around the whole
 * layout for one array, or a store the page writes and the rail reads.
 * This is the store.
 *
 * It holds exactly one teaching's worth at a time, because only one is
 * ever being read. `PublishContents` clears it on the way out, so the
 * rail cannot be left showing the chapters of the teaching before this
 * one.
 */

let contents: Heading[] = []
const listeners = new Set<() => void>()

/* One frozen empty array, not a fresh one per call. `useSyncExternalStore`
   compares snapshots by identity and loops forever on a getter that
   returns a new value each time it is asked. */
const NOTHING: Heading[] = []

export function publishContents(next: Heading[]): void {
  contents = next
  listeners.forEach((listen) => listen())
}

function subscribe(listen: () => void): () => void {
  listeners.add(listen)
  return () => listeners.delete(listen)
}

export function useContents(): Heading[] {
  return React.useSyncExternalStore(
    subscribe,
    () => contents,
    /* The server has no teaching open. */
    () => NOTHING
  )
}

/**
 * Which chapter the reader is in.
 *
 * The line is a third of the way down the window rather than at its top:
 * a heading that has just scrolled into view is not yet the section being
 * read, and one that has just left the top of the screen still is. Taken
 * from `ChapterBar`, which asks the same question in the same words and
 * now asks it from here.
 */
export function useActiveHeading(headings: Heading[]): number {
  const [active, setActive] = React.useState(-1)
  /* The array is rebuilt by the parent on every render; the ids are not. */
  const key = headings.map((heading) => heading.id).join(' ')

  React.useEffect(() => {
    const ids = key ? key.split(' ') : []
    if (ids.length === 0) return
    let frame = 0

    const read = () => {
      const line = window.innerHeight * 0.33
      let current = -1
      ids.forEach((id, index) => {
        const element = document.getElementById(id)
        if (element && element.getBoundingClientRect().top <= line) current = index
      })
      setActive(current)
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [key])

  return active
}
