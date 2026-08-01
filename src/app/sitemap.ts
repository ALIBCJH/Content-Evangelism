import type { MetadataRoute } from 'next'
import { CATEGORIES, categoryMeta, crossArticle, siteUrl } from '@/lib/content'
import { listPostedArticles } from '@/lib/posted'

/** Regenerated on each request — new articles appear the moment they post. */
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posted = await listPostedArticles()

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/articles`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
    ...CATEGORIES.map((category) => ({
      url: `${siteUrl}/category/${categoryMeta[category].slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    {
      url: `${siteUrl}${crossArticle.href}`,
      lastModified: crossArticle.publishedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    ...posted.map((article) => ({
      url: `${siteUrl}/articles/${article.slug}`,
      lastModified: article.updatedAt ?? article.publishedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
