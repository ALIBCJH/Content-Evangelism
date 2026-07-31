import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Cross } from 'lucide-react'
import { siteInfo, siteUrl } from '@/lib/content'
import { getPostedArticle } from '@/lib/posted'
import { listRealRows } from '@/lib/rows'
import { JsonLd } from '@/components/json-ld'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/motion'
import { ReadingProgress } from '@/components/progress-bar'
import { ReadNext } from '@/components/read-next'
import { ShareRow } from '@/components/share-row'

export const dynamic = 'force-dynamic'

interface Params {
  params: { slug: string }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const article = await getPostedArticle(params.slug)
  if (!article) return { title: 'Article not found' }
  return {
    title: article.title,
    description: article.dek,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.dek,
      url: `/articles/${article.slug}`,
      publishedTime: article.publishedAt,
      authors: [article.authorName],
      ...(article.imageUrl ? { images: [{ url: article.imageUrl }] } : {}),
    },
  }
}

/** Renders the plain-text body: blank line = paragraph, "## " = subheading. */
function ArticleBody({ body }: { body: string }) {
  const blocks = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  let firstParagraphSeen = false
  return (
    <>
      {blocks.map((block, index) => {
        if (block.startsWith('## ')) {
          return (
            <h2
              key={index}
              className="mt-12 font-display text-2xl font-semibold leading-snug text-ink-strong md:text-3xl"
            >
              {block.slice(3)}
            </h2>
          )
        }
        const isFirst = !firstParagraphSeen
        firstParagraphSeen = true
        return (
          <p
            key={index}
            className={`mt-6 font-serif text-lg leading-[1.85] text-ink-muted ${isFirst ? 'dropcap' : ''}`}
          >
            {block}
          </p>
        )
      })}
    </>
  )
}

export default async function PostedArticlePage({ params }: Params) {
  const article = await getPostedArticle(params.slug)
  if (!article) notFound()

  const readNext = (await listRealRows())
    .filter((row) => row.slug !== article.slug)
    .slice(0, 3)

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${siteUrl}/articles/${article.slug}`,
    mainEntityOfPage: `${siteUrl}/articles/${article.slug}`,
    headline: article.title,
    description: article.dek,
    articleSection: article.category,
    datePublished: article.publishedAt,
    author: { '@type': 'Person', name: article.authorName },
    publisher: { '@id': `${siteUrl}/#ministry`, '@type': 'Organization', name: siteInfo.ministry },
    isPartOf: { '@id': `${siteUrl}/#website` },
    inLanguage: 'en',
    ...(article.imageUrl ? { image: [`${siteUrl}${article.imageUrl}`] } : {}),
  }

  return (
    <>
      <JsonLd data={articleLd} />
      <ReadingProgress />
      <SiteHeader />
      <main>
        <article className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6 md:pb-28 lg:px-8">
          <FadeIn>
            <header className="text-center">
              <Badge variant="gold" size="sm">{article.category}</Badge>
              <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-[1.12] tracking-tight text-ink-strong sm:text-4xl md:text-5xl">
                {article.title}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl font-serif text-lg italic leading-relaxed text-ink-muted">
                {article.dek}
              </p>
              <p className="mt-7 font-sans text-xs text-ink-subtle">
                <span className="font-semibold text-ink-muted">{article.authorName}</span>
                <span aria-hidden className="mx-2">·</span>
                <time dateTime={article.publishedAt}>
                  {format(parseISO(article.publishedAt), 'd MMM yyyy')}
                </time>
                <span aria-hidden className="mx-2">·</span>
                <span className="tabular">{article.readMinutes} min read</span>
              </p>
              <ShareRow title={article.title} className="mt-6" />
            </header>

            {article.imageUrl && (
              <figure className="mt-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.imageUrl}
                  alt=""
                  className="w-full rounded-2xl border border-hairline object-cover"
                />
              </figure>
            )}

            <div className="mx-auto mt-12 max-w-2xl">
              <ArticleBody body={article.body} />

              <div className="mt-14 border-t border-hairline pt-8">
                <div className="ornament mx-auto max-w-xs">
                  <Cross className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <ShareRow title={article.title} className="mt-8" />
                <div className="mt-10 flex justify-center">
                  <Link
                    href="/articles"
                    className="group inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                    All articles
                  </Link>
                </div>
              </div>

              <ReadNext rows={readNext} />
            </div>
          </FadeIn>
        </article>
      </main>
      <SiteFooter />
    </>
  )
}
