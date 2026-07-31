import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  kicker: string
  title: string
  lede?: string
  href?: string
  hrefLabel?: string
  align?: 'left' | 'center'
  tone?: 'default' | 'onDark'
  className?: string
}

/**
 * Newspaper section header: gold kicker, Fraunces title, hairline rule,
 * optional "view the full desk" link on the right.
 */
export function SectionHeading({
  kicker,
  title,
  lede,
  href,
  hrefLabel = 'View all',
  align = 'left',
  tone = 'default',
  className,
}: SectionHeadingProps) {
  const centered = align === 'center'
  return (
    <div className={cn('mb-8 md:mb-10', className)}>
      <div
        className={cn(
          'flex items-end justify-between gap-6 border-b pb-4',
          tone === 'onDark' ? 'border-white/15' : 'border-hairline-strong',
          centered && 'flex-col items-center border-b-0 pb-0 text-center'
        )}
      >
        <div className={cn(centered && 'flex flex-col items-center')}>
          <p className="kicker text-gold">{kicker}</p>
          <h2
            className={cn(
              'mt-2 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl',
              tone === 'onDark' ? 'text-white' : 'text-ink-strong'
            )}
          >
            {title}
          </h2>
          {lede && (
            <p
              className={cn(
                'mt-3 max-w-xl font-serif text-base leading-relaxed',
                tone === 'onDark' ? 'text-white/70' : 'text-ink-muted'
              )}
            >
              {lede}
            </p>
          )}
        </div>
        {href && !centered && (
          <Link
            href={href}
            className={cn(
              'group mb-1 hidden shrink-0 items-center gap-2 font-sans text-xs font-bold uppercase tracking-kicker sm:inline-flex',
              tone === 'onDark' ? 'text-white/60 hover:text-gold-light' : 'text-ink-subtle hover:text-gold'
            )}
          >
            {hrefLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </div>
  )
}
