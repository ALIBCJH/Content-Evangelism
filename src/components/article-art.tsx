import * as React from 'react'
import {
  Anchor, Bird, BookOpen, Compass, Crown, Droplets, Flame, Lamp,
  Megaphone, Mountain, Scroll, Sparkles, Sprout, Sunrise, Users, Wheat,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ArticleArt as ArticleArtSpec, ArtIcon, ArtPalette } from '@/lib/content'

/**
 * Illuminated plate — the Herald publishes no stock photography. Every
 * piece receives a deterministic art plate: a layered gradient "sky",
 * concentric halo rings, a sealed emblem, and the site grain. The result
 * reads as commissioned illustration rather than a missing image.
 */

const PALETTES: Record<ArtPalette, { base: string; halo: string; emblem: string }> = {
  dawn: {
    base: 'radial-gradient(130% 100% at 82% -10%, rgba(124,196,255,0.55) 0%, rgba(124,196,255,0) 55%), linear-gradient(160deg, #0F2647 0%, #1F4585 100%)',
    halo: 'rgba(170,214,255,0.35)',
    emblem: '#AAD6FF',
  },
  flame: {
    base: 'radial-gradient(130% 100% at 80% -10%, rgba(232,185,35,0.5) 0%, rgba(232,185,35,0) 55%), linear-gradient(160deg, #2A1A04 0%, #8A6508 100%)',
    halo: 'rgba(232,185,35,0.4)',
    emblem: '#F3D268',
  },
  olive: {
    base: 'radial-gradient(130% 100% at 80% -10%, rgba(110,231,183,0.4) 0%, rgba(110,231,183,0) 55%), linear-gradient(160deg, #0E2117 0%, #1E5C40 100%)',
    halo: 'rgba(110,231,183,0.35)',
    emblem: '#9FEBCB',
  },
  wine: {
    base: 'radial-gradient(130% 100% at 80% -10%, rgba(253,164,175,0.35) 0%, rgba(253,164,175,0) 55%), linear-gradient(160deg, #240B14 0%, #7C2D3E 100%)',
    halo: 'rgba(253,164,175,0.35)',
    emblem: '#FDC4CB',
  },
  orchid: {
    base: 'radial-gradient(130% 100% at 80% -10%, rgba(139,124,246,0.5) 0%, rgba(139,124,246,0) 55%), linear-gradient(160deg, #171432 0%, #4C3D99 100%)',
    halo: 'rgba(139,124,246,0.4)',
    emblem: '#BCB2FA',
  },
  midnight: {
    base: 'radial-gradient(130% 100% at 80% -10%, rgba(124,196,255,0.22) 0%, rgba(124,196,255,0) 55%), linear-gradient(160deg, #070B16 0%, #1E3355 100%)',
    halo: 'rgba(124,196,255,0.22)',
    emblem: '#8FB4DE',
  },
  harvest: {
    base: 'radial-gradient(130% 100% at 80% -10%, rgba(252,211,77,0.5) 0%, rgba(252,211,77,0) 55%), linear-gradient(160deg, #241703 0%, #9A6A0B 100%)',
    halo: 'rgba(252,211,77,0.4)',
    emblem: '#FBE08E',
  },
}

const ICONS: Record<ArtIcon, LucideIcon> = {
  flame: Flame,
  dove: Bird,
  scroll: Scroll,
  mountain: Mountain,
  lamp: Lamp,
  crown: Crown,
  wheat: Wheat,
  anchor: Anchor,
  star: Sparkles,
  shepherd: Users,
  vine: Sprout,
  trumpet: Megaphone,
  book: BookOpen,
  sunrise: Sunrise,
  well: Droplets,
  compass: Compass,
}

interface ArticleArtProps {
  art: ArticleArtSpec
  className?: string
  /** Tailwind size classes for the emblem seal, e.g. 'h-14 w-14'. */
  sealClassName?: string
  iconClassName?: string
}

export function ArticleArt({ art, className, sealClassName, iconClassName }: ArticleArtProps) {
  const palette = PALETTES[art.palette]
  const Icon = ICONS[art.icon]

  return (
    <div
      aria-hidden
      className={cn('relative isolate overflow-hidden', className)}
      style={{ background: palette.base }}
    >
      {/* Concentric halo rings */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {[52, 92, 136, 184, 236].map((r, i) => (
          <circle
            key={r}
            cx="200"
            cy="150"
            r={r}
            stroke={palette.halo}
            strokeOpacity={0.5 - i * 0.09}
            strokeWidth="1"
          />
        ))}
        {/* Rays */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * Math.PI) / 6
          return (
            <line
              key={i}
              x1={200 + Math.cos(angle) * 60}
              y1={150 + Math.sin(angle) * 60}
              x2={200 + Math.cos(angle) * 300}
              y2={150 + Math.sin(angle) * 300}
              stroke={palette.halo}
              strokeOpacity="0.12"
              strokeWidth="1"
            />
          )
        })}
      </svg>

      {/* Emblem seal */}
      <div className="absolute inset-0 grid place-items-center">
        <div
          className={cn(
            'grid place-items-center rounded-full border backdrop-blur-[2px]',
            'h-16 w-16 border-white/25 bg-white/10 shadow-[0_0_40px_-6px_rgba(0,0,0,0.4)]',
            sealClassName
          )}
        >
          <Icon
            className={cn('h-7 w-7', iconClassName)}
            strokeWidth={1.5}
            style={{ color: palette.emblem }}
          />
        </div>
      </div>

      {/* Emblem color + grain + vignette */}
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 -60px 80px -40px rgba(0,0,0,0.45)' }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ backgroundImage: 'var(--grain-image)' }}
      />
    </div>
  )
}

export function artEmblemColor(palette: ArtPalette) {
  return PALETTES[palette].emblem
}
