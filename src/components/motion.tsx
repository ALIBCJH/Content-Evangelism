'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Scroll-reveal primitives. One orchestrated rise per section — restrained,
 * editorial motion rather than scattered effects.
 *
 * These are deliberately fail-safe. The hidden state is applied by JS on
 * mount and removed by an IntersectionObserver, so the server always sends
 * visible markup: if scripting is off, the observer never fires, or the
 * reader prefers reduced motion, the content is simply there. Reveals that
 * ship `opacity: 0` from the server can strand a whole page blank, and the
 * front page and article body both sit above the fold.
 */

/** Applies the reveal lifecycle to a wrapper element. */
function useReveal<T extends HTMLElement>(margin = '-80px') {
  const ref = React.useRef<T>(null)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      return
    }

    node.setAttribute('data-reveal', 'pending')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.setAttribute('data-reveal', 'in')
          io.unobserve(entry.target)
        })
      },
      { rootMargin: margin }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [margin])

  return ref
}

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 20,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={cn('reveal', className)}
      style={
        {
          '--reveal-y': `${y}px`,
          '--reveal-delay': `${delay}s`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}

export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useReveal<HTMLDivElement>('-60px')
  return (
    <div ref={ref} className={cn('reveal reveal-parent', className)}>
      {children}
    </div>
  )
}

/**
 * A child of <Stagger>. Its delay comes from its position, so the group
 * rises in sequence once the parent enters the viewport.
 */
export function StaggerItem({
  children,
  className,
  y = 22,
}: {
  children: React.ReactNode
  className?: string
  y?: number
}) {
  return (
    <div
      className={cn('reveal-item', className)}
      style={{ '--reveal-y': `${y}px` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
