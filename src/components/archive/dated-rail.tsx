import * as React from 'react'

/**
 * The dated rail: a year, a wire down the page, and a gold marker beside
 * each entry.
 *
 * Both of the ministry's archives are chronologies — the prophecy records
 * and the published writing are the same shape of thing — so this is the
 * spine they share rather than two implementations that drift apart. A
 * change to how the archive reads is made once, here.
 *
 * The rail is withdrawn below `sm`: 92px of chronology is width the card
 * needs more, and every entry carries its own dateline anyway.
 */

export function DatedRail({ children }: { children: React.ReactNode }) {
  return <ol>{children}</ol>
}

export function DatedRailItem({
  /**
   * The year to print beside this entry, or null to leave the marker
   * unlabelled — which is how a run of entries from the same year reads
   * as one block instead of repeating itself, and how a record whose date
   * is still to be confirmed avoids claiming one.
   */
  year,
  children,
}: {
  year: string | null
  children: React.ReactNode
}) {
  return (
    <li className="grid grid-cols-1 sm:grid-cols-[92px_minmax(0,1fr)]">
      <div className="relative hidden pt-8 sm:block">
        {year && (
          <span className="font-mono text-[0.6875rem] tracking-[0.08em] text-gold">{year}</span>
        )}
        <span aria-hidden className="absolute inset-y-0 left-6 w-px bg-rule sm:left-[46px]" />
        <span
          aria-hidden
          className="absolute left-[18px] top-9 h-[9px] w-[9px] rounded-full bg-gold sm:left-[42px]"
        />
      </div>
      {children}
    </li>
  )
}
