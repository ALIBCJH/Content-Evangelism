import * as React from 'react'
import Link from 'next/link'
import { Layers } from 'lucide-react'
import { series } from '@/lib/content'
import { ArticleArt } from '@/components/article-art'
import { SectionHeading } from '@/components/section-heading'
import { FadeIn } from '@/components/motion'

/**
 * The series shelf — tall spines in a horizontal scroll, like volumes
 * in a study. Progress bars show how far each series has been published.
 */
export function FeaturedSeries() {
  return (
    <section id="series" aria-label="Featured series" className="border-y border-hairline bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Reading rooms"
          title="Featured Series"
          lede="Multi-part journeys through Scripture — begin anywhere, walk at your own pace."
          href="#series"
          hrefLabel="Browse the shelf"
        />
      </div>
      <FadeIn>
        <div className="scroll-row flex gap-6 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8 xl:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {series.map((entry) => {
            const complete = entry.partsPublished >= entry.parts
            const progress = Math.round((entry.partsPublished / entry.parts) * 100)
            return (
              <Link
                key={entry.slug}
                href={`#series-${entry.slug}`}
                className="group w-[17rem] shrink-0 sm:w-[19rem]"
              >
                <article className="card card-interactive h-full overflow-hidden !rounded-2xl">
                  <div className="relative">
                    <ArticleArt art={entry.art} className="aspect-[4/5]" sealClassName="h-14 w-14" iconClassName="h-6 w-6" />
                    <div className="absolute inset-x-0 bottom-0 p-5 pt-16" style={{ background: 'linear-gradient(to top, rgba(4,8,18,0.85), transparent)' }}>
                      <p className="flex items-center gap-1.5 font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-white/70">
                        <Layers className="h-3.5 w-3.5" />
                        {entry.parts}-part series
                      </p>
                      <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-white">
                        {entry.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="font-serif text-sm leading-relaxed text-ink-muted line-clamp-2">
                      {entry.description}
                    </p>
                    <div className="mt-4">
                      <div className="h-1 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className="h-full rounded-full bg-gold transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-2 font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
                        {complete
                          ? 'Complete — read from part one'
                          : `${entry.partsPublished} of ${entry.parts} parts published`}
                      </p>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      </FadeIn>
    </section>
  )
}
