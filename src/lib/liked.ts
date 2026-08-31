'use client'

/**
 * What this browser has already been asked, and what it answered.
 *
 * The prompt at the foot of a teaching must be asked once and never
 * again — an invitation that reappears every visit is not an invitation,
 * it is nagging, and a reader learns to dismiss it without reading it.
 *
 * localStorage, like `saved.ts` and `reading-progress.ts`, and for the
 * same reason: this is a fact about one reader, and this site does not
 * keep facts about readers on its server. The cost is that clearing site
 * data means being asked again, which is the right way round — the
 * alternative is knowing who somebody is.
 */

const KEY = 'liked-teachings'

interface Answers {
  /** Slugs this browser said yes to. */
  liked: string[]
  /** Slugs it has been asked about at all, however it answered. */
  asked: string[]
}

const empty: Answers = { liked: [], asked: [] }

function read(): Answers {
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<Answers>) : null
    if (!parsed) return empty
    return {
      liked: Array.isArray(parsed.liked) ? parsed.liked.filter((s) => typeof s === 'string') : [],
      asked: Array.isArray(parsed.asked) ? parsed.asked.filter((s) => typeof s === 'string') : [],
    }
  } catch {
    return empty
  }
}

function write(next: Answers): void {
  try {
    /* Bounded. One localStorage key that only ever grows is how a browser
       store becomes a problem nobody notices until it is full. */
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ liked: next.liked.slice(-200), asked: next.asked.slice(-200) })
    )
  } catch {
    /* A full or blocked store is not worth an error in a reader's face. */
  }
}

/** Whether this browser has already been asked about a teaching. */
export function wasAsked(slug: string): boolean {
  if (typeof window === 'undefined') return true
  return read().asked.includes(slug)
}

/** Whether it said yes. */
export function wasLiked(slug: string): boolean {
  if (typeof window === 'undefined') return false
  return read().liked.includes(slug)
}

/** Remember that it was asked, and what came of it. */
export function remember(slug: string, liked: boolean): void {
  if (typeof window === 'undefined') return
  const held = read()
  write({
    liked: liked && !held.liked.includes(slug) ? [...held.liked, slug] : held.liked,
    asked: held.asked.includes(slug) ? held.asked : [...held.asked, slug],
  })
}
