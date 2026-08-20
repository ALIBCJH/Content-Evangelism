'use client'

import * as React from 'react'

/**
 * The pieces a reader has put aside.
 *
 * There are no accounts on this site and there is no reason to introduce
 * them for a bookmark, so a saved piece is a slug in this browser's
 * localStorage and nothing leaves the machine. It survives a reload and a
 * closed tab, which is what "save for later" has to mean, and it does not
 * follow anybody anywhere.
 *
 * `ready` is the flag every consumer needs: until the effect has run, the
 * server's markup is all there is, and drawing a filled bookmark before
 * then would be React reconciling one page against another.
 */

const KEY = 'saved-pieces'

/**
 * Saving used to be a slug in a list, which is a note of what a reader
 * meant to read rather than anything they could read. The worker is told
 * at the moment of saving, so the teaching is fetched while there is
 * still a connection to fetch it with — and let go when they unsave it,
 * because a reader who put something back is not asking us to keep it.
 */
function tellTheWorker(type: 'keep' | 'release', slug: string): void {
  try {
    navigator.serviceWorker?.ready
      .then((registration) => {
        registration.active?.postMessage({ type, href: `/articles/${slug}` })
      })
      .catch(() => undefined)
  } catch {
    /* No worker, no offline copy, and nothing worth saying about it. */
  }
}

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

export function useSaved() {
  const [saved, setSaved] = React.useState<string[]>([])
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setSaved(read())
    setReady(true)

    /* The same reader, in another tab, is still the same reader. */
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) setSaved(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = React.useCallback((slug: string) => {
    setSaved((current) => {
      const removing = current.includes(slug)
      const next = removing ? current.filter((s) => s !== slug) : [slug, ...current]
      tellTheWorker(removing ? 'release' : 'keep', slug)
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* Private browsing with storage denied: the toggle still works
           for this page view, and simply does not outlive it. */
      }
      return next
    })
  }, [])

  return { saved, ready, toggle, isSaved: (slug: string) => saved.includes(slug) }
}
