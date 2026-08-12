import * as React from 'react'
import { Check } from 'lucide-react'

/**
 * The badge a record carries when the ministry has designated it
 * fulfilled.
 *
 * The wording of the title attribute matters: this is the ministry's own
 * designation of its own record, not an independent verdict, and the
 * archive is careful everywhere else to keep those two apart.
 */
export function FulfilledBadge({ tone = 'paper' }: { tone?: 'paper' | 'navy' }) {
  return (
    <span
      title="So designated by the Ministry of Repentance and Holiness"
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-chip font-mono font-medium uppercase tracking-[0.14em] text-white ${
        tone === 'navy'
          ? 'bg-fulfilled-navy px-3.5 py-1.5 text-[0.6875rem]'
          : 'bg-fulfilled px-3 py-1.5 text-[0.625rem]'
      }`}
    >
      <Check aria-hidden className="h-3 w-3" strokeWidth={3} />
      Fulfilled
    </span>
  )
}
