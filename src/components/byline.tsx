import * as React from 'react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { authorById } from '@/lib/content'

interface BylineProps {
  authorId: string
  publishedAt: string
  readMinutes?: number
  className?: string
  tone?: 'default' | 'onDark'
}

export function Byline({ authorId, publishedAt, readMinutes, className, tone = 'default' }: BylineProps) {
  const author = authorById(authorId)
  return (
    <p
      className={cn(
        'font-sans text-xs',
        tone === 'onDark' ? 'text-white/55' : 'text-ink-subtle',
        className
      )}
    >
      <span className={cn('font-semibold', tone === 'onDark' ? 'text-white/80' : 'text-ink-muted')}>
        {author.name}
      </span>
      <span aria-hidden className="mx-2">·</span>
      <time dateTime={publishedAt}>{format(parseISO(publishedAt), 'd MMM yyyy')}</time>
      {readMinutes ? (
        <>
          <span aria-hidden className="mx-2">·</span>
          <span className="tabular">{readMinutes} min read</span>
        </>
      ) : null}
    </p>
  )
}

export function AuthorAvatar({
  name,
  className,
  ringClassName,
}: {
  name: string
  className?: string
  ringClassName?: string
}) {
  const initials = name
    .replace(/^(Rev\.|Dr\.|Prophet|Pastor|Bishop)\s+/i, '')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full border font-display font-semibold',
        'border-gold/40 bg-gradient-to-br from-flagship-deep/70 to-navy-200 text-gold-light',
        'h-11 w-11 text-sm',
        ringClassName,
        className
      )}
    >
      {initials}
    </span>
  )
}
