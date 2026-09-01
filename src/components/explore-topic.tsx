import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { categoryBlurb, topicHref, type Category } from '@/lib/content'

/**
 * The way up out of a finished teaching: the section it belongs to.
 *
 * There were two ways out here — up to the section, and sideways to the
 * next three teachings, both set as archive rows. The sideways one has
 * moved into `ExploreMore` at the foot of the page, where it is a shelf
 * of pictures instead of three lines of grey text, and shows eight
 * instead of three. Offering both would be one recommendation wearing
 * two hats, which is the thing this page has been careful about
 * everywhere else.
 *
 * What is left is the move a strip of teachings cannot make: not another
 * piece, but the whole subject this one sits inside.
 */
export function ExploreTopic({ category }: { category: Category }) {
  return (
    <section className="mt-16 border-t border-rule pt-10">
      <h2 className="kicker text-gold">Explore the topic</h2>
      <Link href={topicHref(category)} className="focus-ring group mt-4 block">
        <span className="flex items-baseline gap-3">
          <span className="font-display text-[1.5rem] font-medium leading-tight text-navy transition-colors group-hover:text-gold">
            <span className="headline-link">{category}</span>
          </span>
          <ArrowRight
            aria-hidden
            className="h-4 w-4 shrink-0 translate-y-px text-ink-subtle transition-all group-hover:translate-x-1 group-hover:text-gold"
          />
        </span>
        <span className="mt-2 block max-w-prose text-[0.9375rem] leading-[1.7] text-ink-muted">
          {categoryBlurb[category]}
        </span>
      </Link>
    </section>
  )
}
