'use client'

import * as React from 'react'

/**
 * Put a piece aside, or take it back out.
 *
 * Two shapes for the same control: the lead card has room to say what it
 * does, a row has room for a bookmark. Both sit above the card's own link
 * — a card is a link edge to edge, so anything clickable inside it needs
 * to be lifted out of that surface deliberately.
 */
export function SaveButton({
  saved,
  ready,
  onToggle,
  title,
  compact = false,
}: {
  saved: boolean
  ready: boolean
  onToggle: () => void
  /** Named in the label, because a row has several of these on a page. */
  title: string
  compact?: boolean
}) {
  const label = saved ? `Remove ${title} from saved` : `Save ${title} for later`

  if (compact) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={ready ? saved : undefined}
        aria-label={label}
        title={saved ? 'Saved — click to remove' : 'Save for later'}
        data-track="save-piece"
        className={`focus-ring relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-tile border transition-colors ${
          saved
            ? 'border-gold bg-chip-gold text-gold-ink'
            : 'border-rule bg-card text-ink-subtle hover:border-gold-pale hover:text-gold'
        }`}
      >
        <Bookmark filled={saved} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={ready ? saved : undefined}
      aria-label={label}
      data-track="save-piece"
      className={`focus-ring relative z-10 inline-flex items-center gap-2.5 rounded-tile border px-5 py-3 text-[0.9375rem] font-medium transition-colors ${
        saved
          ? 'border-gold bg-chip-gold text-gold-ink'
          : 'border-rule bg-card text-ink-900 hover:border-gold-pale hover:text-gold-ink'
      }`}
    >
      <Bookmark filled={saved} />
      {saved ? 'Saved' : 'Save for later'}
    </button>
  )
}

function Bookmark({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 3.75h11a.75.75 0 0 1 .75.75v15.4l-6.25-4-6.25 4V4.5a.75.75 0 0 1 .75-.75Z" />
    </svg>
  )
}
