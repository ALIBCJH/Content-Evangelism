'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bookmark, BookOpen, GraduationCap, RadioTower } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSaved } from '@/lib/saved'

/**
 * The reader's navigation, at the bottom, on a phone.
 *
 * Until now the only way through the site on a phone was the menu button
 * in the masthead — a sheet that had to be opened, read and dismissed to
 * go one place. That is three deliberate acts for a thing a reader does
 * constantly, and it put the whole of the site's structure behind a
 * button in the top corner, which is the furthest point on the screen
 * from a thumb.
 *
 * Four destinations, always visible, where the hand already is. The
 * masthead keeps the sheet for the wider menu and keeps search; this is
 * the short list of places somebody actually moves between.
 *
 * Saved earns its slot by being the one place that was unreachable. A
 * reader could put a teaching aside from any page and then had nowhere to
 * go and find it again — the count on the tab is the first time the site
 * has admitted those pieces exist.
 *
 * Phones only. From `lg` up the masthead lays every section out inline
 * and a second navigation would be a second answer to a question already
 * answered — the same reasoning the header uses for its own breakpoint.
 */

interface Tab {
  href: string
  label: string
  icon: typeof BookOpen
  /** Which paths count as being here, beyond the href itself. */
  owns?: (path: string) => boolean
}

const TABS: Tab[] = [
  {
    href: '/',
    label: 'Reading',
    icon: BookOpen,
    /* A teaching, the archive and a subject listing are all the reading
       room. A reader who opens a piece has not left the section they
       found it in, and a tab bar that went dark when they did would be
       telling them they are nowhere. */
    owns: (path) =>
      path === '/' ||
      path.startsWith('/articles') ||
      path.startsWith('/topics') ||
      path.startsWith('/authors'),
  },
  { href: '/prophecies', label: 'Prophecy', icon: RadioTower },
  { href: '/teachings', label: 'Teachings', icon: GraduationCap },
  { href: '/saved', label: 'Saved', icon: Bookmark },
]

function isHere(tab: Tab, path: string): boolean {
  if (tab.owns) return tab.owns(path)
  return path === tab.href || path.startsWith(`${tab.href}/`)
}

export function BottomNav() {
  const pathname = usePathname() ?? '/'
  const { saved, ready } = useSaved()

  return (
    <nav
      aria-label="Sections"
      /* `bottom-nav` carries the height and the safe-area padding, which
         the page's own bottom margin is set from — see globals.css. One
         declaration, so the bar and the room made for it cannot drift
         apart. */
      className="bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-hairline-strong bg-surface/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map((tab) => {
          const here = isHere(tab, pathname)
          const Icon = tab.icon
          /* Only once the browser has read localStorage. Drawing a count
             from the server's empty list and then correcting it is the
             flicker `ready` exists to prevent. */
          const count = tab.href === '/saved' && ready ? saved.length : 0

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={here ? 'page' : undefined}
                className={cn(
                  'focus-ring relative flex h-full flex-col items-center justify-center gap-1 px-1 pb-1.5 pt-2 transition-colors',
                  here ? 'text-ink-strong' : 'text-ink-subtle hover:text-ink-muted'
                )}
              >
                {/* The same gold rule the masthead marks a section with,
                    so "where am I" is answered the same way in both. */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-x-0 top-0 mx-auto h-[2px] w-10 rounded-full transition-opacity',
                    here ? 'bg-gold opacity-100' : 'opacity-0'
                  )}
                />
                <span className="relative">
                  <Icon
                    aria-hidden
                    className="h-[1.375rem] w-[1.375rem]"
                    strokeWidth={here ? 2 : 1.75}
                  />
                  {count > 0 && (
                    <span
                      className="absolute -right-2.5 -top-1.5 min-w-[1.05rem] rounded-full bg-gold px-1 text-center font-sans text-[0.625rem] font-bold leading-[1.05rem] text-navy"
                      /* Read out as part of the link rather than as a
                         loose number beside it. */
                      aria-hidden
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </span>
                <span className="font-sans text-[0.6875rem] font-semibold leading-none">
                  {tab.label}
                </span>
                {count > 0 && <span className="sr-only">{count} saved</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
