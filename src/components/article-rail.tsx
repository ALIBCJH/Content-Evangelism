'use client'

import * as React from 'react'
import Link from 'next/link'
import type { Heading } from '@/lib/toc'
import type { Verse } from '@/lib/scripture-index'

/**
 * The apparatus beside a teaching: the chapters, and the Scriptures it
 * rests on.
 *
 * The chapters are anchors rather than buttons — the whole teaching is
 * already on the page, so `href="#chapter"` does the work, and does it for
 * a crawler, a keyboard, and a middle click too. The only client-side
 * state is which chapter is currently in view.
 *
 * It is set in the apparatus face, not the reading face. The rail is
 * something a reader scans to find a place, never something they read
 * through, and the type should say so.
 *
 * The two halves are exported separately as well as together, because a
 * wide screen sets them on opposite sides of the column: where you are in
 * the teaching on the left, what the teaching rests on the right. One
 * screen down, there is only room for one rail, and `ArticleRail` is both
 * halves stacked in it.
 */
/** Where the reader is, and everywhere else they could be. */
export function ChapterNav({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (headings.length === 0) return
    let ticking = false
    const spy = () => {
      const line = window.innerHeight * 0.33
      let current: string | null = null
      for (const heading of headings) {
        const el = document.getElementById(heading.id)
        if (el && el.getBoundingClientRect().top <= line) current = heading.id
      }
      setActiveId(current)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(spy)
      }
    }
    spy()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  /* One chapter is not a structure worth printing. */
  if (headings.length < 2) return null

  return (
    <nav aria-label="On this page" className="font-apparatus">
      <p className="mb-3 inline-block border-b-[3px] border-gold pb-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-navy">
        On this page
      </p>
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          aria-current={activeId === heading.id ? 'true' : undefined}
          className={`block border-l-2 py-2 pl-3 text-[0.875rem] leading-[1.45] transition-colors hover:border-gold-pale hover:text-gold ${
            activeId === heading.id
              ? 'border-gold font-semibold text-gold-ink'
              : 'border-transparent text-ink-700'
          }`}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  )
}

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

/**
 * Both halves in one rail, for the width that has room for only one.
 *
 * The lower half is a slot rather than a fixed block: this file is client
 * code, and what sits under the chapters is read off the archive at build
 * time. Passing it in as children keeps that work on the server, where a
 * list of records costs the reader nothing to receive.
 */
export function ArticleRail({
  headings,
  children,
}: {
  headings: Heading[]
  children?: React.ReactNode
}) {
  if (headings.length < 2 && !children) return null

  return (
    <aside className="flex flex-col gap-10 self-start lg:sticky lg:top-stick">
      <ChapterNav headings={headings} />
      {children}
    </aside>
  )
}
