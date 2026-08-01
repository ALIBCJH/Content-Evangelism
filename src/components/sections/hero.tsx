import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { ArrowRight, Newspaper, TrendingUp } from 'lucide-react'
import type { ArticleArt as ArticleArtSpec } from '@/lib/content'
import { CardImage } from '@/components/article-card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Stagger, StaggerItem } from '@/components/motion'

/**
 * The front page — two columns above the fold. The lead is always the
 * newest published article; the rail lists the pieces after it, so the
 * front page rotates with every publish and nothing repeats.
 */

export interface FrontRailRow {
  href: string
  title: string
  category: string
  readMinutes: number
  imageUrl?: string
  art: ArticleArtSpec
}

export interface FrontLead extends FrontRailRow {
  dek: string
  authorName: string
  publishedAt: string
  imageUrl?: string
  art: ArticleArtSpec
  /** When present, the opening paragraphs render as a blurred-out teaser. */
  body?: string
}

/** First readable paragraphs of a body (skips `## ` headings). */
function teaserParagraphs(body: string, count = 3): string[] {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block && !block.startsWith('## '))
    .slice(0, count)
}

export function Hero({ lead, rail }: { lead: FrontLead; rail: FrontRailRow[] }) {
  return (
    <section aria-label="Front page" className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:pb-20 lg:px-8">
      <Stagger className="col-rules grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-0">
        {/* ── Lead story ─────────────────────────────────────── */}
        <StaggerItem className="lg:col-span-8 lg:pr-12">
          <Link href={lead.href} className="group block">
            <CardImage
              row={lead}
              className="aspect-[16/9] w-full rounded-2xl border border-hairline"
              sizes="(min-width: 1024px) 66vw, 100vw"
              priority
            />
            <div className="mt-6">
              <Badge variant="gold" size="sm">{lead.category}</Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.12] tracking-tight text-ink-strong md:text-5xl">
                <span className="headline-link">{lead.title}</span>
              </h2>
              <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-ink-muted md:text-xl">
                {lead.dek}
              </p>
              <p className="mt-5 font-sans text-xs text-ink-subtle">
                <span className="font-semibold text-ink-muted">{lead.authorName}</span>
                <span aria-hidden className="mx-2">·</span>
                <time dateTime={lead.publishedAt}>
                  {formatDistanceToNowStrict(parseISO(lead.publishedAt), { addSuffix: true })}
                </time>
                <span aria-hidden className="mx-2">·</span>
                <span className="tabular">{lead.readMinutes} min read</span>
              </p>
            </div>
          </Link>

          {/* ── Teaser: the article itself begins, then falls away ── */}
          {lead.body ? (
            <div className="relative mt-7">
              <div
                aria-hidden
                className="max-h-52 overflow-hidden [mask-image:linear-gradient(to_bottom,black_25%,rgba(0,0,0,0.35)_65%,transparent_92%)] md:max-h-60"
              >
                {teaserParagraphs(lead.body).map((paragraph, index) => (
                  <p
                    key={index}
                    className={`font-serif text-base leading-[1.8] text-ink-muted md:text-lg ${index === 0 ? 'dropcap' : 'mt-5'}`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                <Link href={lead.href} className={`${buttonVariants({ size: 'lg' })} shadow-glow-gold`}>
                  Read More
                  <ArrowRight />
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-7">
              <Link href={lead.href} className={buttonVariants({ size: 'lg' })}>
                Read the Full Article
                <ArrowRight />
              </Link>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/articles" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              <Newspaper />
              See More Articles
            </Link>
          </div>
        </StaggerItem>

        {/* ── Latest rail ────────────────────────────────────── */}
        <StaggerItem className="lg:col-span-4 lg:pl-12">
          <div className="flex items-center gap-2 border-b border-hairline-strong pb-3">
            <TrendingUp className="h-4 w-4 text-gold" />
            <p className="kicker text-ink">More from the desk</p>
          </div>
          <ol className="divide-y divide-hairline">
            {rail.map((story) => (
              <li key={story.href + story.title}>
                <Link href={story.href} className="group flex items-center gap-4 py-4">
                  <CardImage
                    row={story}
                    className="aspect-[16/11] w-24 shrink-0 rounded-lg border border-hairline"
                    sizes="96px"
                    sealClassName="h-8 w-8"
                    iconClassName="h-3.5 w-3.5"
                  />
                  <span className="min-w-0">
                    <span className="block font-display text-[1.02rem] font-semibold leading-snug text-ink transition-colors group-hover:text-ink-strong">
                      {story.title}
                    </span>
                    <span className="mt-1.5 block font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
                      {story.category} · {story.readMinutes} min
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </StaggerItem>
      </Stagger>
    </section>
  )
}
