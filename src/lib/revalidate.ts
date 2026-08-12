import { revalidatePath } from 'next/cache'

/**
 * Flushes every cached page a publish or an edit can change.
 *
 * The reader-facing pages are statically cached and refresh on their own
 * every five minutes. That is the right trade for crawlers and readers,
 * but it would mean the desk publishes an article and then waits to see
 * it. Revalidating here closes that gap: the cache is the fast path, and
 * publishing is still immediate.
 */
export function revalidatePublished(slug?: string): void {
  revalidatePath('/') // the archive, and its opener
  revalidatePath('/feed.xml')
  revalidatePath('/sitemap.xml')
  revalidatePath('/topics/[slug]', 'page') // every section listing
  revalidatePath('/authors/[id]', 'page') // every byline's page
  if (slug) revalidatePath(`/articles/${slug}`)
}
