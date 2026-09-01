'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Heart, Share2 } from 'lucide-react'
import type { ArchiveItem } from '@/lib/archive-items'
import { TeachingArt } from '@/components/archive/teaching-art'
import { cn } from '@/lib/utils'

/**
 * What is at the foot of a finished teaching: the rest of the archive,
 * as a strip a reader can push through.
 *
 * The close of an article used to offer three rows in a column, set like
 * the archive listing. That is the right language halfway down a listing
 * and the wrong one here. A reader who has just finished a teaching is
 * not scanning a column to choose between fifteen things — they have
 * finished, and the question is whether there is a reason to stay. Three
 * ruled rows of grey text is not a reason; a shelf of pictures is, and it
 * shows eight where the column showed three in less height than the
 * column took.
 *
 * It scrolls sideways rather than wrapping. Wrapping would make the foot
 * of every teaching taller than some of the teachings, and a strip that
 * runs off the right edge says there is more without spending the page on
 * saying it.
 *
 * `.scroll-row` is the site's own horizontal strip — snapping, and no
 * scrollbar drawn — so this reads like the rows the front page already
 * uses rather than inventing a second kind of sideways.
 *
 * The arrows are for the pointer. A touch screen swipes and a keyboard
 * uses the arrow keys on the focused strip — both work without them —
 * but a mouse has neither of those, and a horizontal scrollbar is not
 * something anybody drags on purpose.
 */
export function ExploreMore({ items }: { items: ArchiveItem[] }) {
  const strip = React.useRef<HTMLUListElement>(null)
  const [at, setAt] = React.useState<{ start: boolean; end: boolean }>({
    start: true,
    end: false,
  })

  /* Which end the strip is against, so an arrow that would do nothing
     says so rather than sitting there looking live. */
  const read = React.useCallback(() => {
    const element = strip.current
    if (!element) return
    const room = element.scrollWidth - element.clientWidth
    setAt({
      start: element.scrollLeft <= 1,
      /* A pixel of slack: sub-pixel widths mean the last scroll rarely
         lands on the exact end. */
      end: element.scrollLeft >= room - 1,
    })
  }, [])

  React.useEffect(() => {
    read()
    const element = strip.current
    if (!element) return
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [read])

  const push = (direction: -1 | 1) => {
    const element = strip.current
    if (!element) return
    /* One screenful less a card, so the card at the edge stays in view
       and a reader keeps their place instead of being teleported. */
    const step = Math.max(240, element.clientWidth - 280)
    element.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <section aria-labelledby="explore-more" className="border-t border-rule bg-raised">
      <div className="shell py-12 sm:py-16">
        <div className="flex items-center justify-between gap-6">
          <h2
            id="explore-more"
            className="font-display text-[1.75rem] font-medium leading-[1.1] tracking-[-0.015em] text-navy sm:text-[2.25rem]"
          >
            Explore more
          </h2>

          {/* Hidden from touch, where the strip is swiped, and from a
              screen reader, which moves through the links themselves. */}
          <div aria-hidden className="hidden shrink-0 gap-3 sm:flex">
            <Arrow onClick={() => push(-1)} disabled={at.start} label="Back" />
            <Arrow onClick={() => push(1)} disabled={at.end} label="Forward" />
          </div>
        </div>

        <ul
          ref={strip}
          onScroll={read}
          tabIndex={0}
          aria-label="More teachings"
          className="scroll-row focus-ring mt-8 flex gap-6 overflow-x-auto pb-2"
        >
          {items.map((item) => (
            <li key={item.slug} className="w-[16.5rem] shrink-0 sm:w-[18.5rem]">
              <Card item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Arrow({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void
  disabled: boolean
  label: string
}) {
  const Icon = label === 'Back' ? ArrowLeft : ArrowRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      tabIndex={-1}
      aria-label={label}
      className={cn(
        'focus-ring flex h-11 w-11 items-center justify-center rounded-full border transition-colors',
        disabled
          ? 'cursor-default border-rule-soft text-ink-subtle/50'
          : 'border-rule text-navy hover:border-gold hover:text-gold'
      )}
    >
      <Icon aria-hidden className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.8} />
    </button>
  )
}

/** One teaching on the shelf. */
function Card({ item }: { item: ArchiveItem }) {
  return (
    <article className="group relative">
      {/* 16:10, as every landscape crop in the archive is cut — so the
          card shows the whole of the picture somebody framed. */}
      <span className="relative block aspect-[16/10] overflow-hidden rounded-md bg-surface-2">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail.src}
            alt=""
            fill
            sizes="(min-width: 640px) 296px, 264px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <TeachingArt
            art={item.art}
            cite={item.quote?.cite}
            category={item.category}
            className="absolute inset-0"
          />
        )}
      </span>

      {/* The section on the left, what readers have done with it on the
          right — the same two marks the archive listing draws, always
          shown, with the figures only where there are any. A nought
          would say the teaching was offered and refused. */}
      <p className="kicker mt-4 flex items-center justify-between gap-3 text-ink-500">
        <span className="min-w-0 truncate text-gold-ink">{item.category}</span>
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="inline-flex items-center gap-1">
            <Heart aria-hidden className="h-3 w-3" strokeWidth={2.2} />
            {item.likes > 0 && <span className="tabular">{item.likes}</span>}
            <span className="sr-only">
              {item.likes === 1
                ? '1 reader said this helped them'
                : `${item.likes} readers said this helped them`}
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 aria-hidden className="h-3 w-3" strokeWidth={2.2} />
            {item.shares > 0 && <span className="tabular">{item.shares}</span>}
            <span className="sr-only">
              {item.shares === 0 ? 'Not shared yet' : `Shared ${item.shares} times`}
            </span>
          </span>
        </span>
      </p>

      {/* Set in the teaching's own face and weight, as the listing is:
          the words a reader chooses look like the words they land on. */}
      <h3 className="mt-2 text-pretty font-article text-[1.1875rem] font-extrabold leading-[1.25] tracking-[-0.008em] text-navy">
        <Link href={item.href} data-track="explore-more" className="focus-ring">
          <span aria-hidden className="absolute inset-0" />
          <span className="headline-link headline-link--drawn">{item.title}</span>
        </Link>
      </h3>

      {item.dek && (
        <p className="mt-2 font-reading text-[0.9375rem] leading-[1.55] text-ink-700 line-clamp-3">
          {item.dek}
        </p>
      )}

      <p className="kicker mt-3 text-ink-500">by {item.authorName}</p>
    </article>
  )
}
