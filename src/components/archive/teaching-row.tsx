'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ArchiveItem } from '@/lib/archive-items'
import { Posted } from '@/components/posted'
import { TeachingArt } from '@/components/archive/teaching-art'

/**
 * One teaching in a listing: a mark on the left, the headline beside it.
 *
 * The shape every news front page on a phone has settled on, and for a
 * reason worth stating rather than copying. A column of headlines with
 * nothing beside them is read by nobody — the eye has no place to stop,
 * so five teachings become one grey block. A mark on each row gives it
 * somewhere to land, and five rows can be scanned in a screen.
 *
 * A third of the width, which is the proportion the BBC and the rest
 * have converged on: enough to be a picture, not so much that the
 * headline is squeezed into three words a line.
 *
 * Ruled, not carded. A card costs a border and padding on both edges,
 * and on a 390px phone that is thirty or forty pixels of measure gone
 * from the only thing on the row that matters. A hairline does the same
 * work — these are separate things — and costs one pixel.
 */
export function TeachingRow({ item }: { item: ArchiveItem }) {
  return (
    <article className="group relative py-4">
      <div className="flex items-start gap-3.5">
        {/* The mark. A photograph where the teaching has one, and the
            section's own field where it does not — see TeachingArt for
            why that is not a placeholder. */}
        <span
          className="relative aspect-[16/10] w-[7.5rem] shrink-0 overflow-hidden rounded-md sm:w-[9rem]"
          style={{ containerType: 'inline-size' }}
        >
          {item.image ? (
            <Image
              src={item.image.src}
              alt=""
              fill
              sizes="(max-width: 640px) 120px, 144px"
              className="object-cover"
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

        <div className="min-w-0 flex-1">
          <h3 className="text-pretty font-apparatus text-[1rem] font-bold leading-[1.28] tracking-[-0.011em] text-navy sm:text-[1.0625rem]">
            <Link href={item.href} data-track="read-article" className="focus-ring">
              {/* The whole row follows the headline, so the small print
                  under it is not a second link to the same place. */}
              <span aria-hidden className="absolute inset-0" />
              <span className="headline-link">{item.title}</span>
            </Link>
          </h3>

          {/* Two facts, not three. The section was the third and it is
              already carried by the colour of the field beside it — and
              on this archive nearly every row said "Teachings", so it
              distinguished nothing while pushing "MIN" onto a line of
              its own. */}
          <p className="kicker mt-1.5 leading-[1.5] text-ink-subtle">
            <Posted iso={item.publishedAt} dated={item.dated} />
            <span aria-hidden className="mx-1.5">·</span>
            <span className="tabular">{item.readMinutes}</span> min
          </p>
        </div>
      </div>
    </article>
  )
}
