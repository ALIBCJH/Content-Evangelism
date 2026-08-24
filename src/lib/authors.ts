import { authors as standing, type Author } from '@/lib/content'
import { listWriters } from '@/lib/writers'

/**
 * Everybody the site can show an author page for.
 *
 * There were two sources of truth and only one of them could grow. The
 * table in content.ts is the ministry's standing masthead, written into
 * the repository; the registry is the people who have actually been given
 * a desk. A byline resolves against both, and the registry wins on a
 * collision, because somebody who signs in and writes is more current
 * than a line in a file.
 *
 * `articles` is a seed figure describing a lifetime of writing, which is
 * a thing the ministry may want to claim for its senior teachers and is
 * not a thing a new writer has. It is zero for a registry writer, and the
 * author page counts what is actually published here anyway.
 *
 * Read on every render rather than cached: the registry changes when
 * somebody is added, and an author page that waits for a deploy to admit
 * a writer exists is the problem this replaced.
 */
export async function authorDirectory(): Promise<Author[]> {
  const registered: Author[] = (await listWriters()).map((writer) => ({
    id: writer.id,
    name: writer.name,
    role: writer.role,
    bio: writer.bio,
    articles: 0,
    accent: writer.accent,
    kind: 'person',
  }))

  const claimed = new Set(registered.map((author) => author.name))
  return [...registered, ...standing.filter((author) => !claimed.has(author.name))]
}

/** The profile behind a byline, or undefined — the byline still renders. */
export function byName(directory: Author[], name: string): Author | undefined {
  return directory.find((author) => author.name === name)
}

export function byId(directory: Author[], id: string): Author | undefined {
  return directory.find((author) => author.id === id)
}

/** The common case: one byline, one lookup. */
export async function findAuthorByName(name: string): Promise<Author | undefined> {
  return byName(await authorDirectory(), name)
}
