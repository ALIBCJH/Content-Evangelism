'use client'

import * as React from 'react'

/**
 * The box that searches one shelf.
 *
 * The site has a search that covers everything, in the masthead, and it is
 * the right tool when a reader does not know where a thing is filed. It is
 * the wrong tool for somebody already standing in the prophecy archive who
 * wants the Colombia record: they have to leave the page, search the whole
 * site, and pick their shelf back out of the results.
 *
 * So each archive carries its own box, in its own band, filtering the
 * shelf in front of the reader — the same control the writing archive
 * already had, in the same place, matched by the same scoring rules.
 *
 * It sits on the title's line, short on a phone and full width from `sm`,
 * so that a band which used to say one word now also does a job.
 */
export function SectionSearch({
  value,
  onChange,
  label,
  placeholder = 'Search',
}: {
  value: string
  onChange: (value: string) => void
  /** What the box searches, for a screen reader: "Search the records". */
  label: string
  placeholder?: string
}) {
  return (
    <label className="relative ml-auto w-[9.5rem] shrink-0 sm:w-auto sm:min-w-[18rem] sm:max-w-[22rem]">
      <span className="sr-only">{label}</span>
      <SearchIcon />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="focus-ring w-full rounded-chip border border-rule bg-card py-2 pl-9 pr-3 text-[0.875rem] text-ink-900 placeholder:text-ink-subtle sm:py-2.5 sm:pl-10 sm:pr-4 sm:text-[0.9375rem]"
      />
    </label>
  )
}

/** What was found, and the way out of a search that found nothing. */
export function SearchSummary({
  query,
  count,
  noun,
  onClear,
}: {
  query: string
  count: number
  /** "record", "recording" — named in the singular. */
  noun: string
  onClear: () => void
}) {
  if (!query.trim()) return null

  return (
    <p className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.9375rem] text-ink-muted">
      <span>
        <span className="tabular font-mono">{count}</span> {count === 1 ? noun : `${noun}s`} for
        &ldquo;{query.trim()}&rdquo;
      </span>
      <button
        type="button"
        onClick={onClear}
        className="focus-ring rounded-chip font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-navy transition-colors hover:text-gold"
      >
        Clear →
      </button>
    </p>
  )
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle sm:left-3.5"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  )
}
