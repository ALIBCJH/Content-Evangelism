import * as React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  authorHref,
  categoryBlurb,
  siteInfo,
  siteUrl,
} from '@/lib/content'
import { findAuthorByName } from '@/lib/authors'
import { getPostedArticle, listPostedArticles } from '@/lib/posted'
import { listRealRows, relatedRows } from '@/lib/rows'
import { bodyToPlainText, extractFaqs, wordCount } from '@/lib/article-body'
import { buildScriptureIndex, versesFor } from '@/lib/scripture-index'
import { scriptureRefs } from '@/lib/scripture'
import { schemaImage } from '@/lib/images'
import { rssAlternate } from '@/lib/seo'
import { extractHeadings } from '@/lib/toc'
import { ArticleLayout } from '@/components/article-layout'
import { ArticleProse } from '@/components/article-prose'
import { JsonLd } from '@/components/json-ld'

/* Articles are rendered once and served from the cache, refreshed every
   five minutes and immediately on publish or edit. Under force-dynamic
   every crawler hit re-rendered the page and re-read the store from disk,
   which is paid for in time-to-first-byte on every single request. */
export const revalidate = 300

/** Everything already published is built ahead of time; later pieces are
 *  rendered on first request and then cached the same way. */
export async function generateStaticParams() {
  return (await listPostedArticles()).map((article) => ({ slug: article.slug }))
}

interface Params {
  params: { slug: string }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const article = await getPostedArticle(params.slug)
  if (!article) return { title: 'Article not found', robots: { index: false, follow: false } }

  const author = await findAuthorByName(article.authorName)
  return {
    title: article.title,
    description: article.dek,
    keywords: [article.category, 'Ministry of Repentance and Holiness', siteInfo.head],
    authors: [
      author ? { name: author.name, url: `${siteUrl}${authorHref(author)}` } : { name: article.authorName },
    ],
    alternates: { canonical: `/articles/${article.slug}`, types: rssAlternate },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.dek,
      url: `/articles/${article.slug}`,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
      authors: [article.authorName],
      section: article.category,
      tags: [article.category],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.dek,
    },
  }
}

export default async function PostedArticlePage({ params }: Params) {
  const article = await getPostedArticle(params.slug)
  if (!article) notFound()

  /* One read of the archive serves both ways out of a teaching: the
     rows at the foot, and the slugs a writer named with `@related` in the
     body, which resolve against the same list. */
  const rows = await listRealRows()
  const related = relatedRows(rows, article.slug, article.category)

  /* What the rail offers: the archive minus this piece and minus what the
     close of it already carries, newest first. Five, because a rail is
     read down in one pass or not at all. */
  const more = rows
    .filter(
      (row) => row.slug !== article.slug && !related.some((near) => near.slug === row.slug)
    )
    .slice(0, 5)
  const links = Object.fromEntries(
    rows.map((row) => [row.slug, { href: row.href, title: row.title, dek: row.dek }])
  )

  const url = `${siteUrl}/articles/${article.slug}`
  const author = await findAuthorByName(article.authorName)
  const image = article.imageUrl
    ? await schemaImage(article.imageUrl, article.imageAlt)
    : null

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: article.title,
    description: article.dek,
    articleSection: article.category,
    /* The full text, so an AI engine answering a question about this
       teaching quotes the teaching rather than the summary. */
    articleBody: bodyToPlainText(article.body),
    wordCount: wordCount(article.body),
    keywords: [article.category, siteInfo.ministry].join(', '),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    timeRequired: `PT${article.readMinutes}M`,
    /* A named author with a profile to point at is what E-E-A-T rests on;
       an unattributed piece is credited to the ministry itself. */
    author:
      author && author.kind !== 'desk'
        ? {
            '@type': 'Person',
            '@id': `${siteUrl}${authorHref(author)}#person`,
            name: author.name,
            url: `${siteUrl}${authorHref(author)}`,
            jobTitle: author.role,
            worksFor: { '@id': `${siteUrl}/#ministry` },
          }
        : {
            '@type': 'Organization',
            '@id': `${siteUrl}/#ministry`,
            name: siteInfo.ministry,
            ...(author ? { url: `${siteUrl}${authorHref(author)}` } : {}),
          },
    publisher: { '@id': `${siteUrl}/#ministry`, '@type': 'Organization', name: siteInfo.ministry },
    isPartOf: { '@id': `${siteUrl}/#website` },
    inLanguage: 'en',
    isAccessibleForFree: true,
    about: { '@type': 'Thing', name: article.category, description: categoryBlurb[article.category] },
    ...(image ? { image: [image], thumbnailUrl: image.url } : {}),
  }

  const headings = extractHeadings(article.body)

  /* The archive as its own concordance: every verse these teachings set
     out, so the references beside this one can be read rather than only
     cited. Built from the rows already in hand. */
  const verses = versesFor(buildScriptureIndex(rows), scriptureRefs(article.body, 12))

  /* A teaching that answers questions at its foot says so in structured
     data too, as its own node rather than folded into the Article — which
     is what makes the answers eligible to be quoted on their own. */
  const faqs = extractFaqs(article.body)
  const faqLd = faqs.length > 0 && {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    isPartOf: { '@id': `${siteUrl}/#website` },
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <>
      <JsonLd data={articleLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <ArticleLayout
        slug={article.slug}
        category={article.category}
        title={article.title}
        dek={article.dek}
        author={{
          name: author?.name ?? article.authorName,
          ...(author ? { href: authorHref(author) } : {}),
        }}
        publishedAt={article.publishedAt}
        readMinutes={article.readMinutes}
        verified={article.verified}
        {...(article.imageUrl
          ? { hero: { src: article.imageUrl, alt: article.imageAlt ?? '' } }
          : {})}
        headings={headings}
        verses={verses}
        related={related}
        more={more}
        body={article.body}
      >
        <ArticleProse body={article.body} links={links} />
      </ArticleLayout>
    </>
  )
}
