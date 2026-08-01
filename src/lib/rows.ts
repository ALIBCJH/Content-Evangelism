import {
  categoryArt,
  crossArticle,
  type ArticleArt as ArticleArtSpec,
  type Category,
} from '@/lib/content'
import { listPostedArticles } from '@/lib/posted'

/** A normalized article row: every real piece on the site, newest first. */
export interface RealRow {
  slug: string
  href: string
  title: string
  dek: string
  category: Category
  authorName: string
  publishedAt: string
  readMinutes: number
  imageUrl?: string
  art: ArticleArtSpec
  /** Search haystack (body included for posted pieces). */
  text: string
  /** Display body (posted pieces only) — feeds the front-page teaser. */
  body?: string
}

export async function listRealRows(): Promise<RealRow[]> {
  const posted = await listPostedArticles()
  const rows: RealRow[] = [
    ...posted.map((a) => ({
      slug: a.slug,
      href: `/articles/${a.slug}`,
      title: a.title,
      dek: a.dek,
      category: a.category,
      authorName: a.authorName,
      publishedAt: a.publishedAt,
      readMinutes: a.readMinutes,
      imageUrl: a.imageUrl,
      art: categoryArt[a.category],
      text: `${a.title}\n${a.dek}\n${a.body}`.toLowerCase(),
      body: a.body,
    })),
    {
      slug: crossArticle.slug,
      href: crossArticle.href!,
      title: crossArticle.title,
      dek: crossArticle.dek,
      category: crossArticle.category,
      authorName: 'The Editorial Desk',
      publishedAt: crossArticle.publishedAt,
      readMinutes: crossArticle.readMinutes,
      imageUrl: crossArticle.image?.src,
      art: crossArticle.art,
      text: `${crossArticle.title}\n${crossArticle.dek}`.toLowerCase(),
    },
  ]
  return rows.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
