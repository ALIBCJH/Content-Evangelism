'use client'

import * as React from 'react'

/**
 * The teaching being written, kept where it cannot be lost.
 *
 * A piece here is a thousand words typed into a textarea. A reload, a
 * closed tab, a publish that comes back 401 because the key was wrong —
 * any of them threw the lot away, and the desk had no way of knowing that
 * until it happened. So the form is written to this browser as it is
 * typed, and offered back when the desk returns.
 *
 * It stays on the machine that typed it. There is no draft state in the
 * store and this does not invent one: nothing here is on the site, and
 * nothing here has left the desk's own browser.
 */

const KEY = 'posting-desk-draft'
const SAVE_AFTER_MS = 800

export interface Draft {
  editingSlug: string | null
  title: string
  category: string
  dek: string
  body: string
  authorName: string
  imageUrl: string
  imageAlt: string
  tags: string
  at: number
}

/** Whether a draft has anything in it worth keeping. */
export function worthKeeping(draft: Omit<Draft, 'at'>): boolean {
  return Boolean(draft.title.trim() || draft.dek.trim() || draft.body.trim())
}

export function readDraft(): Draft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Draft
    return parsed && typeof parsed.body === 'string' ? parsed : null
  } catch {
    return null
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* Nothing to do, and nothing worth saying to the desk about it. */
  }
}

/**
 * Saves the form as it is typed, a moment after typing stops.
 *
 * Returns when it last saved, which is the whole point of the feature
 * being visible: a writer who cannot see that it saved does not believe
 * it saved.
 */
export function useDraftAutosave(draft: Omit<Draft, 'at'>): number | null {
  const [savedAt, setSavedAt] = React.useState<number | null>(null)
  const serialised = JSON.stringify(draft)

  React.useEffect(() => {
    if (!worthKeeping(JSON.parse(serialised) as Omit<Draft, 'at'>)) return
    const timer = window.setTimeout(() => {
      try {
        const at = Date.now()
        window.localStorage.setItem(KEY, JSON.stringify({ ...JSON.parse(serialised), at }))
        setSavedAt(at)
      } catch {
        /* A full store is not worth interrupting a writer over. */
      }
    }, SAVE_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [serialised])

  return savedAt
}
