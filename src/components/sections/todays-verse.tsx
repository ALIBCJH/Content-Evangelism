import * as React from 'react'
import { BookOpenText } from 'lucide-react'
import { todaysVerse } from '@/lib/content'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/motion'
import { CopyVerseButton } from '@/components/sections/verse-actions'

/**
 * A typographic selah between the sections — the day's verse set large,
 * with room to breathe.
 */
export function TodaysVerse() {
  return (
    <section id="verse" aria-label="Today's verse" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(50% 65% at 50% 50%, rgba(212,160,23,0.10) 0%, rgba(212,160,23,0.03) 45%, transparent 75%)',
        }}
      />
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 md:py-28 lg:px-8">
        <FadeIn>
          <div className="ornament mx-auto max-w-xs">
            <BookOpenText className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <p className="kicker mt-6 text-gold">Today’s Verse</p>
          <blockquote className="mt-8">
            <p className="font-display text-2xl font-medium leading-snug tracking-tight text-ink-strong sm:text-3xl md:text-[2.35rem] md:leading-[1.25]">
              “{todaysVerse.text}”
            </p>
            <footer className="mt-8 flex flex-col items-center gap-4">
              <Badge variant="gold">{todaysVerse.reference} · {todaysVerse.translation}</Badge>
              <p className="font-serif text-base italic text-ink-muted">{todaysVerse.reflection}</p>
              <CopyVerseButton
                text={`“${todaysVerse.text}” — ${todaysVerse.reference} (${todaysVerse.translation})`}
              />
            </footer>
          </blockquote>
        </FadeIn>
      </div>
    </section>
  )
}
