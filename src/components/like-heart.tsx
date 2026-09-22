import type { CSSProperties } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Eight small hearts round the big one, alternating red and gold and
   alternating near and far, so the burst reads as a scatter rather than
   a clock face. Angles in degrees, distance in rem. */
const SPARKS = [
  { a: 0, d: 3.1, gold: false },
  { a: 45, d: 2.5, gold: true },
  { a: 90, d: 3.1, gold: false },
  { a: 135, d: 2.5, gold: true },
  { a: 180, d: 3.1, gold: false },
  { a: 225, d: 2.5, gold: true },
  { a: 270, d: 3.1, gold: false },
  { a: 315, d: 2.5, gold: true },
]

/**
 * The heart on a like button, and what it does when a reader presses it.
 *
 * A like was a heart outline turning into a filled one, in the same
 * colour, with nothing moving — easy to press without noticing anything
 * had happened, and a reader who does not see an answer presses again or
 * decides the button is broken. This is the answer every app has taught
 * people to expect: the heart turns red, dips and springs back larger, a
 * ring goes out from it, small hearts scatter and one floats up.
 *
 * `burst` is a counter, not a flag. Each press that should play the
 * animation bumps it, and it is the `key` of the moving parts, so React
 * mounts them afresh and the CSS animation runs again from the start —
 * with nothing to clean up afterwards, because each part ends invisible.
 * Nought means never pressed on this visit: a heart liked on an earlier
 * visit is drawn filled and still.
 */
export function LikeHeart({
  liked,
  burst,
  className,
}: {
  liked: boolean
  burst: number
  className?: string
}) {
  return (
    <span aria-hidden className={cn('relative inline-flex shrink-0', className)}>
      <span key={`pop-${burst}`} className={cn('inline-flex h-full w-full', burst > 0 && 'like-pop')}>
        <Heart
          className={cn('h-full w-full transition-colors', liked && 'text-heart')}
          strokeWidth={2}
          fill={liked ? 'currentColor' : 'none'}
        />
      </span>
      {burst > 0 && (
        <span key={`burst-${burst}`}>
          <span className="like-ring" />
          {/* One heart that rises off the button and fades, the way a
              like leaves a live stream — the part of this a reader sees
              even out of the corner of an eye. */}
          <Heart className="like-float text-heart" fill="currentColor" strokeWidth={0} />
          {SPARKS.map((spark) => (
            <Heart
              key={spark.a}
              className={cn('like-spark', spark.gold ? 'text-gold' : 'text-heart')}
              fill="currentColor"
              strokeWidth={0}
              style={{ '--a': `${spark.a}deg`, '--d': `${spark.d}rem` } as CSSProperties}
            />
          ))}
        </span>
      )}
    </span>
  )
}
