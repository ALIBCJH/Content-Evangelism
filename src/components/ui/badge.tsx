import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border font-sans text-[0.6875rem] font-bold uppercase tracking-kicker transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-surface-3 text-ink',
        gold: 'border-gold/30 bg-gold/10 text-gold',
        outline: 'border-hairline-strong bg-transparent text-ink-muted',
        flagship: 'border-flagship/30 bg-flagship/10 text-flagship',
        orchid: 'border-orchid/30 bg-orchid/10 text-orchid',
      },
      size: {
        default: 'px-3 py-1',
        sm: 'px-2.5 py-0.5 text-[0.6875rem]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
