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
  revalidatePath('/') // the front page, and the piece it leads with
  revalidatePath('/articles') // the archive
  revalidatePath('/teachings') // the section counts
  revalidatePath('/feed.xml')
  revalidatePath('/sitemap.xml')
  revalidatePath('/topics/[slug]', 'page') // every section listing
  revalidatePath('/authors/[id]', 'page') // every byline's page
  if (slug) revalidatePath(`/articles/${slug}`)
}

/**
 * The same, for a question answered in the open.
 *
 * The index and the page itself flush at once, which is what the desk
 * watches: publish, and the page is there; take it down, and the address
 * 404s on the next request rather than five minutes later.
 *
 * The sitemap is asked as well and does not answer — `revalidatePath` does
 * not reach Next's metadata routes here, which is true of the article
 * publish path above too. It is left in rather than dropped because the
 * intent is right and the call is harmless, and the sitemap catches up on
 * its own five-minute cycle either way. A crawler is not waiting on the
 * minute; the desk is.
 */
export function revalidateAnswers(slug?: string): void {
  revalidatePath('/questions')
  revalidatePath('/sitemap.xml')
  if (slug) revalidatePath(`/questions/${slug}`)
}
