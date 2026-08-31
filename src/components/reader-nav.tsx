'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, GraduationCap, RadioTower } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The sections, standing still down the left of every reader page.
 *
 * The site carried its sections along the top, which is the right answer
 * on a phone and a wasteful one on a wide screen: the row sat in the
 * masthead using the least valuable strip of the page, and a reader
 * moving between Articles and the Prophecy Archive had to go back up to
 * it every time. A rail down the side is always in view, never in the
 * way, and it costs a column that a 1440px screen has going spare — the
 * archive was already leaving three hundred pixels of margin on each
 * side of itself.
 *
 * From `xl` only, and that is not a compromise. Below it there is no
 * spare column to spend, the masthead's own row and the menu sheet are
 * what a narrow screen should have, and both are untouched.
 *
 * Every entry here goes somewhere that exists. That sounds like it does
 * not need saying, and it does: the shape this rail is modelled on
 * carries five entries, two of which — the ministry's own story, and
 * what the congregation is reading — have not been built yet. Adding
 * them now to make the column look fuller would spend a reader's first
 * click on a page that is not there, which is a worse first impression
 * than a short list.
 */

const SECTIONS = [
  { label: 'Articles', href: '/', icon: BookOpen },
  { label: 'Teachings', href: '/teachings', icon: GraduationCap },
  { label: 'Prophecies', href: '/prophecies', icon: RadioTower },
] as const

/** The front page owns `/` and nothing else; the rest own their subtrees. */
function isCurrent(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function ReaderNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Sections"
      /* Sticky under the masthead rather than scrolling away with the
         page: a rail that leaves is a row in a different position. */
      className="hidden xl:sticky xl:top-[73px] xl:block xl:self-start xl:py-8 xl:pl-8 xl:pr-6"
    >
      <ul className="space-y-1">
        {SECTIONS.map((section) => {
          const current = isCurrent(pathname, section.href)
          const Icon = section.icon
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] transition-colors',
                  current
                    ? 'font-semibold text-navy'
                    : 'font-normal text-ink-500 hover:text-navy'
                )}
              >
                <Icon
                  aria-hidden
                  className="h-[1.15rem] w-[1.15rem] shrink-0"
                  strokeWidth={current ? 2.1 : 1.7}
                />
                {section.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
