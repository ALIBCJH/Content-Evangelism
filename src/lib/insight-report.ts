'use client'

import type { EventBatch } from '@/lib/insight-shape'

/**
 * The one way anything on this site reports to the counters.
 *
 * The page tracker and the teaching read on the front page both come
 * through here, so the rules about who may be counted are written once:
 * a reader who has asked not to be counted is not counted, and a failure
 * to report is never an error in anybody's console.
 */

const ENDPOINT = '/api/insight'

export function optedOut(): boolean {
  if (typeof navigator === 'undefined') return true
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  return (
    nav.doNotTrack === '1' ||
    nav.msDoNotTrack === '1' ||
    (window as Window & { doNotTrack?: string }).doNotTrack === '1' ||
    nav.globalPrivacyControl === true
  )
}

/**
 * `sendBeacon` where it matters: a fetch issued while the page is closing
 * is cancelled with the document, and the reading worth having is the one
 * that ends when the reader leaves.
 */
export function report(batches: EventBatch[], useBeacon: boolean): void {
  if (batches.length === 0 || optedOut()) return
  const body = JSON.stringify({ batches })
  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
    } else {
      void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      })
    }
  } catch {
    /* A counter is never worth an error in a reader's console. */
  }
}
