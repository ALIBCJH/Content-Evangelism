import * as React from 'react'
import { ArrowRight, Flame } from 'lucide-react'
import { featuredOracle } from '@/lib/content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Byline } from '@/components/byline'
import { FadeIn } from '@/components/motion'

/**
 * The Featured Oracle — the paper's most reverent room. A candlelit navy
 * chamber, double gold frame, one word given the space it deserves.
 */
export function FeaturedOracle() {
  return (
    <section id="oracle" aria-label="Featured oracle" className="relative">
      <div className="relative overflow-hidden bg-navy-900">
        {/* Candle glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(55% 70% at 50% 105%, rgba(212,160,23,0.22) 0%, rgba(212,160,23,0.06) 45%, transparent 70%), radial-gradient(40% 40% at 85% 0%, rgba(31,69,133,0.5) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ backgroundImage: 'var(--grain-image)' }}
        />

        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <FadeIn>
            {/* Double gold frame */}
            <div className="rounded-[1.75rem] border border-gold/25 p-2.5 sm:p-3">
              <div className="rounded-3xl border border-gold/40 px-6 py-12 text-center sm:px-12 md:px-16 md:py-16">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-gold/10 shadow-glow-gold">
                  <Flame className="h-6 w-6 text-gold-light" strokeWidth={1.5} />
                </span>

                <p className="kicker mt-8 text-gold">
                  {featuredOracle.kicker} · No. XXVII
                </p>

                <h2 className="mx-auto mt-6 max-w-3xl font-display text-2xl font-medium leading-snug text-white sm:text-3xl md:text-[2.1rem]">
                  {featuredOracle.title}
                </h2>

                <p className="relative mx-auto mt-8 max-w-2xl font-serif text-lg italic leading-relaxed text-white/80 md:text-xl">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 select-none font-display text-7xl font-bold leading-none text-gold/15 sm:-left-14 sm:top-0 sm:translate-x-0"
                  >
                    “
                  </span>
                  {featuredOracle.excerpt}
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {featuredOracle.scripture.split('·').map((ref) => (
                    <Badge key={ref} variant="gold" size="sm">{ref.trim()}</Badge>
                  ))}
                </div>

                <Byline
                  tone="onDark"
                  className="mt-8"
                  authorId={featuredOracle.authorId}
                  publishedAt={featuredOracle.publishedAt}
                  readMinutes={featuredOracle.readMinutes}
                />

                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <Button size="lg">
                    Read the full oracle
                    <ArrowRight />
                  </Button>
                  <Button variant="outline" size="lg" className="border-white/25 text-white/85 hover:border-gold/60 hover:text-white">
                    Visit the oracle archive
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
