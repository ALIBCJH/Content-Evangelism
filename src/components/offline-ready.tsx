'use client'

import * as React from 'react'

/**
 * Registers the worker that makes the archive readable without a network.
 *
 * Production only, and deliberately: in development the site is rebuilt
 * every few seconds and a worker holding the previous build is a morning
 * spent debugging a page that was fixed an hour ago.
 *
 * It registers after load rather than during it — a reader waiting for a
 * teaching should not be waiting for the machinery that will help them
 * next time.
 */
export function OfflineReady() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {
        /* A reader with no worker has the site as it always was. */
      })
    }

    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
