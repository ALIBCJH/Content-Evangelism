import * as React from 'react'
import Link from 'next/link'
import { Feather, Hash } from 'lucide-react'
import { recentArticles, topics } from '@/lib/content'
import { ArticleArt } from '@/components/article-art'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Byline } from '@/components/byline'
import { SectionHeading } from '@/components/section-heading'
import { FadeIn, Stagger, StaggerItem } from '@/components/motion'

/**
 * The reading room — a classic newspaper river of recent pieces with a
 * sticky rail: popular topics and the open call for testimonies.
 */
export function RecentArticles() {
  return (
    <section id="articles" aria-label="Recent articles" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <SectionHeading
        kicker="The reading room"
        title="Recent Articles"
        href="#"
        hrefLabel="Open the archive"
      />
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* River */}
        <Stagger className="lg:col-span-8">
          <div className="divide-y divide-hairline">
            {recentArticles.map((article) => (
              <StaggerItem key={article.slug} y={14}>
                <Link
                  href={`#article-${article.slug}`}
                  id={`article-${article.slug}`}
                  className="group flex flex-col gap-5 py-7 first:pt-0 sm:flex-row sm:items-start"
                >
                  <ArticleArt
                    art={article.art}
                    className="aspect-[16/10] w-full shrink-0 rounded-xl border border-hairline sm:aspect-[4/3] sm:w-44"
                    sealClassName="h-11 w-11"
                    iconClassName="h-5 w-5"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" size="sm">{article.category}</Badge>
                    </div>
                    <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-ink-strong md:text-2xl">
                      <span className="headline-link">{article.title}</span>
                    </h3>
                    <p className="mt-2 max-w-2xl font-serif text-[0.95rem] leading-relaxed text-ink-muted line-clamp-2">
                      {article.dek}
                    </p>
                    <Byline
                      className="mt-3"
                      authorId={article.authorId}
                      publishedAt={article.publishedAt}
                      readMinutes={article.readMinutes}
                    />
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button variant="outline" size="lg">Read more from the archive</Button>
          </div>
        </Stagger>

        {/* Rail */}
        <div className="lg:col-span-4">
          <div className="space-y-8 lg:sticky lg:top-20">
            <FadeIn>
              <div className="card !rounded-2xl p-6">
                <div className="flex items-center gap-2 border-b border-hairline pb-3">
                  <Hash className="h-4 w-4 text-gold" />
                  <p className="kicker text-ink">Popular topics</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <Link
                      key={topic.name}
                      href={`#topic-${topic.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="focus-ring group inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3.5 py-1.5 font-sans text-xs font-semibold text-ink-muted transition-colors hover:border-gold/50 hover:text-gold"
                    >
                      {topic.name}
                      <span className="tabular text-[0.625rem] text-ink-subtle group-hover:text-gold/70">
                        {topic.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.12] to-transparent p-6">
                <Feather className="h-6 w-6 text-gold" strokeWidth={1.5} />
                <h3 className="mt-4 font-display text-xl font-semibold text-ink-strong">
                  Has He been faithful to you?
                </h3>
                <p className="mt-2 font-serif text-sm leading-relaxed text-ink-muted">
                  The Herald keeps a standing page for the testimonies of the congregation.
                  Write yours — the editors will walk with you to tell it well.
                </p>
                <Button size="sm" className="mt-5">Submit a testimony</Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  )
}
