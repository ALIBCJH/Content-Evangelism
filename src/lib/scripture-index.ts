import { parseBody, plainInline } from '@/lib/article-body'
import type { RealRow } from '@/lib/rows'

/**
 * The verses the archive itself has already set out, indexed by reference.
 *
 * A teaching cites Romans 6:23 and the rail prints "Romans 6:23", and a
 * reader who wants to know what Romans 6:23 says has to leave the site to
 * find out. The obvious fix is a link to somebody else's Bible; the
 * better one is here already, because these teachings quote Scripture in
 * full all the way through, and a verse quoted in a teaching is a verse
 * this ministry has itself set out.
 *
 * So the archive is its own concordance. What a reader is shown is the
 * passage as the ministry published it, with the teaching it came from
 * named — which is both more useful than a bare reference and more honest
 * than a translation nobody here chose.
 *
 * A reference nothing quotes has no entry, and the rail says so rather
 * than inventing one.
 */

export interface Verse {
  /** The passage, as a teaching on this site sets it out. */
  text: string
  /** The citation as published — "Romans 6:23, KJV". */
  cite: string
  /** The teaching it was quoted in. */
  title: string
  href: string
}

/**
 * References are written loosely and cited loosely: "Romans 6:23",
 * "ROMANS 6:23, KJV", "Romans 6 : 23". This is what makes two of them the
 * same key without pretending to parse Scripture.
 */
export function refKey(reference: string): string {
  return reference
    .toLowerCase()
    .replace(/[,–—-]\s*(kjv|niv|nkjv|esv|nasb|amp)\b.*$/i, '')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s+/g, ' ')
    .replace(/[.,;]+$/, '')
    .trim()
}

/** Every verse the archive quotes, most recent teaching first. */
export function buildScriptureIndex(rows: RealRow[]): Map<string, Verse> {
  const index = new Map<string, Verse>()

  for (const row of rows) {
    for (const block of parseBody(row.body)) {
      if (block.kind !== 'quote' || !block.cite) continue
      const text = block.inlines
        .map(plainInline)
        .join('')
        .replace(/\s+/g, ' ')
        .trim()
      if (!text) continue
      const key = refKey(block.cite)
      if (!key || index.has(key)) continue
      index.set(key, { text, cite: block.cite.trim(), title: row.title, href: row.href })
    }
  }

  return index
}

/** The verses for one teaching's references, as the rail needs them. */
export function versesFor(
  index: Map<string, Verse>,
  references: string[]
): Record<string, Verse> {
  const out: Record<string, Verse> = {}
  for (const reference of references) {
    const verse = index.get(refKey(reference))
    if (verse) out[reference] = verse
  }
  return out
}
