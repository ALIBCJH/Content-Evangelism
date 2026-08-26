import * as React from 'react'
import Link from 'next/link'
import type { Verse } from '@/lib/scripture-index'

/**
 * What a teaching rests on: the Scriptures it cites, each openable in
 * place.
 *
 * This file used to carry the chapter list as well, on the reasoning that
 * a wide screen could set the two on opposite sides of the reading column
 * — where you are in the teaching on the left, what it stands on the
 * right. The chapters travel with the reader now, in the strip under the
 * masthead, at every width rather than only the widest; see `ChapterBar`.
 * The Scriptures stay, and they are not a rail: they are consulted after
 * a reading rather than during one, so they are set at the close.
 *
 * It is in the apparatus face, not the reading face. This is scanned to
 * find a passage, never read through, and the type should say so.
 */
/** What the teaching rests on — no state, so no client work. */
export function ScriptureList({
  scriptures,
  verses = {},
}: {
  scriptures: string[]
  /** The passage behind a reference, where the archive has set one out. */
  verses?: Record<string, Verse>
}) {
  if (scriptures.length === 0) return null

  return (
    <div className="font-apparatus">
      <p className="kicker mb-1.5 border-b border-rule pb-3 text-ink-subtle">Key scriptures</p>
      <ul>
        {scriptures.map((ref) => {
          const verse = verses[ref]
          return (
            <li key={ref} className="border-b border-dotted border-rule py-3 last:border-b-0">
              {verse ? (
                /* Opened in place. A reader following an argument that
                   turns on a verse should not have to leave the argument
                   to read the verse. */
                <details className="group">
                  <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="text-[0.8125rem] font-medium tracking-[0.04em] text-gold-ink">
                      {ref}
                    </span>
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0 text-ink-subtle transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <blockquote className="mt-2.5 border-l-2 border-gold/50 pl-3 font-reading text-[0.9375rem] leading-[1.6] text-ink-700">
                    {verse.text}
                  </blockquote>
                  {/* Whose words these are and where they were set out —
                      the archive quoting itself, not a translation this
                      site picked on a reader's behalf. */}
                  <p className="mt-2 text-[0.6875rem] leading-[1.5] text-ink-subtle">
                    {verse.cite} · as set out in{' '}
                    <Link href={verse.href} className="text-gold-ink underline underline-offset-2">
                      {verse.title}
                    </Link>
                  </p>
                </details>
              ) : (
                <span className="text-[0.8125rem] font-medium tracking-[0.04em] text-gold-ink">
                  {ref}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
