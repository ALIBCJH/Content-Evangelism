import { bodyToPlainText } from '@/lib/article-body'
import {
  categoryArt,
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
  imageAlt?: string
  art: ArticleArtSpec
  /** Search haystack: the title, the standfirst and the body. */
  text: string
  /** The body — also what the front-page teaser is drawn from. */
  body: string
}

/**
 * Every article on the site, newest first.
 *
 * There is one source now: the pieces the posting desk has published.
 * The site previously carried a single hand-set teaching alongside them,
 * spliced in here so that listings, search, related-reading and the
 * sitemap all saw it as an ordinary row; it has since been withdrawn, and
 * with it the splice.
 */
export async function listRealRows(): Promise<RealRow[]> {
  const posted = await listPostedArticles()
  const rows: RealRow[] = posted.map((a) => ({
    slug: a.slug,
    href: `/articles/${a.slug}`,
    title: a.title,
    dek: a.dek,
    category: a.category,
    authorName: a.authorName,
    publishedAt: a.publishedAt,
    readMinutes: a.readMinutes,
    imageUrl: a.imageUrl,
    imageAlt: a.imageAlt,
    art: categoryArt[a.category],
    /* The body as a reader sees it, not as it is written: search should
       match the caption under a photograph, never the path to its file. */
    text: `${a.title}\n${a.dek}\n${bodyToPlainText(a.body)}`.toLowerCase(),
    body: a.body,
  }))
  return rows.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

/**
 * What to read after a given piece.
 *
 * Everything filed under the same section comes first, then the newest of
 * the rest — both halves are already newest-first, because `listRealRows`
 * sorted them. That is as much relatedness as the content model actually
 * knows, and it is real: a reader who has just finished a teaching is
 * offered the other teachings before the oracles.
 */
export function relatedRows(
  rows: RealRow[],
  slug: string,
  category: Category,
  limit = 3
): RealRow[] {
  const others = rows.filter((row) => row.slug !== slug)
  return [
    ...others.filter((row) => row.category === category),
    ...others.filter((row) => row.category !== category),
  ].slice(0, limit)
}
