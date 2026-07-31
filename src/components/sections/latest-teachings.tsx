import * as React from 'react'
import Link from 'next/link'
import { latestTeachings } from '@/lib/content'
import { ArticleArt } from '@/components/article-art'
import { Badge } from '@/components/ui/badge'
import { Byline } from '@/components/byline'
import { SectionHeading } from '@/components/section-heading'
import { Stagger, StaggerItem } from '@/components/motion'

export function LatestTeachings() {
  return (
    <section id="teachings" aria-label="Latest teachings" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <SectionHeading
        kicker="From the pulpit desk"
        title="Latest Teachings"
        href="#teachings"
        hrefLabel="All teachings"
      />
      <Stagger className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {latestTeachings.map((article) => (
          <StaggerItem key={article.slug}>
            <Link href={`#article-${article.slug}`} className="group block">
              <article className="card card-interactive h-full overflow-hidden !rounded-2xl">
                <ArticleArt
                  art={article.art}
                  className="aspect-[16/10]"
                  sealClassName="h-12 w-12"
                  iconClassName="h-5 w-5"
                />
                <div className="flex flex-col p-5">
                  <Badge variant="outline" size="sm" className="self-start">
                    {article.category}
                  </Badge>
                  <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-ink-strong">
                    <span className="headline-link">{article.title}</span>
                  </h3>
                  <p className="mt-2 font-serif text-sm leading-relaxed text-ink-muted line-clamp-3">
                    {article.dek}
                  </p>
                  <Byline
                    className="mt-4"
                    authorId={article.authorId}
                    publishedAt={article.publishedAt}
                    readMinutes={article.readMinutes}
                  />
                </div>
              </article>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
