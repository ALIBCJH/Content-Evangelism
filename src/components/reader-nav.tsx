'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, GraduationCap, Info, RadioTower } from 'lucide-react'
import { useActiveHeading, useContents } from '@/lib/article-contents'
import { siteInfo } from '@/lib/content'
import { cn } from '@/lib/utils'

/**
 * The column down the left of every reader page, and it holds a
 * different thing depending on where the reader is.
 *
 * On the archive and everywhere else it is the sections — where you can
 * go — with a short word underneath about who publishes here, because
 * most people arriving at this site have come from a search result and
 * have never heard of the ministry.
 *
 * Inside a teaching it is the teaching's own chapters. A reader who is
 * already in a piece of writing does not need to be told the site has an
 * archive; they need to know how long this is, what is in it, and where
 * they are in it. The sections are two clicks away in the masthead and
 * one click away at the foot of the rail, which is the right distance for
 * something nobody in the middle of a teaching is looking for.
 *
 * From `xl` only, and that is not a compromise. Below it there is no
 * spare column to spend, and the masthead's own row, the menu sheet and
 * the chapter strip are what a narrow screen should have.
 */

const SECTIONS = [
  { label: 'Articles', href: '/', icon: BookOpen },
  { label: 'Teachings', href: '/teachings', icon: GraduationCap },
  { label: 'Prophecies', href: '/prophecies', icon: RadioTower },
  { label: 'About', href: '/about', icon: Info },
] as const

/** The front page owns `/` and nothing else; the rest own their subtrees. */
function isCurrent(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

const rail = 'hidden xl:sticky xl:top-[73px] xl:block xl:self-start xl:py-8 xl:pl-8 xl:pr-6'

export function ReaderNav() {
  const pathname = usePathname()
  const contents = useContents()
  const reading = pathname.startsWith('/articles/')

  /* Both hooks run on every page — a hook cannot be called conditionally,
     and `useActiveHeading` does nothing at all with an empty list. */
  const active = useActiveHeading(contents)

  if (reading && contents.length > 1) {
    return <Contents headings={contents} active={active} />
  }

  return (
    <nav aria-label="Sections" className={rail}>
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
                  current ? 'font-semibold text-navy' : 'font-normal text-ink-500 hover:text-navy'
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

      {/* Who publishes here, in four lines.

          The rail had three entries and a great deal of nothing under
          them, and this site's own Search Console says most of the people
          who see it have never heard of the ministry. A reader who lands
          on a teaching from a search result and wants to know whose
          teaching it is should not have to go looking. */}
      <div className="mt-8 border-t border-rule pt-6 pl-3 pr-1">
        <p className="kicker text-ink-subtle">About</p>
        <p className="mt-3 text-[0.8125rem] leading-[1.65] text-ink-700">{siteInfo.summary}</p>
        <Link
          href="/about"
          className="focus-ring kicker mt-3 inline-block text-navy transition-colors hover:text-gold"
        >
          More about the ministry →
        </Link>
      </div>
    </nav>
  )
}

/**
 * The chapters of the teaching being read, with the reader's place in it.
 *
 * Only where there is more than one. A teaching with a single chapter has
 * no contents — a list of one is a heading pretending to be a structure —
 * and the rail falls back to the sections, which is a better use of the
 * column than a list that says nothing.
 */
function Contents({ headings, active }: { headings: { id: string; text: string }[]; active: number }) {
  return (
    <nav aria-label="In this teaching" className={rail}>
      <p className="kicker pl-3 text-ink-subtle">In this teaching</p>
      <ol className="mt-4 space-y-0.5">
        {headings.map((heading, index) => {
          const here = index === active
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={here ? 'location' : undefined}
                className={cn(
                  /* The gold rule on the left is the reader's place. It
                     is a border rather than a mark beside the text so
                     that a chapter running to three lines is marked down
                     its whole height, not opposite its first word. */
                  'focus-ring block border-l-2 py-1.5 pl-3 pr-1 text-[0.8125rem] leading-[1.5] transition-colors',
                  here
                    ? 'border-gold font-semibold text-navy'
                    : 'border-transparent text-ink-500 hover:border-rule-strong hover:text-navy'
                )}
              >
                <span className="tabular mr-2 text-ink-subtle">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {heading.text}
              </a>
            </li>
          )
        })}
      </ol>

      <Link
        href="/"
        className="focus-ring kicker mt-7 inline-block border-t border-rule pl-3 pt-6 text-navy transition-colors hover:text-gold"
      >
        ← All articles
      </Link>
    </nav>
  )
}
