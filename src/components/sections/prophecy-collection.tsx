import * as React from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowRight, ScrollText } from 'lucide-react'
import { prophecyCollection } from '@/lib/content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/section-heading'
import { Stagger, StaggerItem } from '@/components/motion'

const themeVariant = {
  'The Nations': 'flagship',
  'The Church': 'gold',
  'The Harvest': 'default',
  'The Return': 'orchid',
} as const

/**
 * The Prophecy Collection — the ministry's numbered prophetic record,
 * kept like an archive of sealed letters. Sober, dated, tested.
 */
export function ProphecyCollection() {
  return (
    <section id="prophecy" aria-label="Prophecy collection" className="relative overflow-hidden bg-navy-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(45% 55% at 12% 0%, rgba(139,124,246,0.16) 0%, transparent 65%), radial-gradient(50% 60% at 95% 100%, rgba(31,69,133,0.45) 0%, transparent 70%)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'var(--grain-image)' }} />

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <SectionHeading
          tone="onDark"
          kicker="The sealed record"
          title="The Prophecy Collection"
          lede="Every word delivered at the altar is written down, numbered, dated — and tested. The record is open to the whole congregation."
        />

        <Stagger className="overflow-hidden rounded-2xl border border-white/10">
          {prophecyCollection.map((entry, index) => (
            <StaggerItem key={entry.numeral} y={14}>
              <Link
                href={`#prophecy-${entry.numeral.toLowerCase()}`}
                className="group flex flex-col gap-5 border-b border-white/10 bg-white/[0.03] px-6 py-7 transition-colors last:border-b-0 hover:bg-white/[0.06] sm:flex-row sm:items-center sm:gap-8 sm:px-8"
              >
                <span
                  aria-hidden
                  className="font-display text-4xl font-semibold text-gold/60 transition-colors group-hover:text-gold sm:w-32 sm:shrink-0"
                >
                  {entry.numeral}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-xl font-semibold leading-snug text-white">
                      {entry.title}
                    </span>
                    <Badge variant={themeVariant[entry.theme]} size="sm">{entry.theme}</Badge>
                  </span>
                  <span className="mt-2 block font-serif text-sm italic leading-relaxed text-white/65">
                    “{entry.excerpt}”
                  </span>
                  <span className="mt-3 block font-sans text-[0.6875rem] uppercase tracking-kicker text-white/45">
                    Delivered {format(parseISO(entry.delivered), 'd MMMM yyyy')} · {entry.scripture}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="hidden h-5 w-5 shrink-0 text-white/30 transition-all group-hover:translate-x-1 group-hover:text-gold sm:block"
                />
              </Link>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-10 flex flex-col items-center gap-5 text-center">
          <p className="flex items-center gap-2 font-serif text-sm italic text-white/55">
            <ScrollText className="h-4 w-4 text-gold/70" />
            “Test everything; hold fast what is good.” — 1 Thessalonians 5:21
          </p>
          <Button variant="outline" className="border-white/25 text-white/85 hover:border-gold/60 hover:text-white">
            Browse the full record
          </Button>
        </div>
      </div>
    </section>
  )
}
