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

/**
 * The profile behind a piece — by id where the piece carries one, by name
 * where it does not.
 *
 * This is the lookup every reader-facing surface should use, and the
 * reason the id was put on the record. A name resolves to whoever in the
 * directory happens to spell theirs the same way, which is fine until two
 * writers do; an id resolves to a person.
 *
 * The fallback is not a lesser answer, it is the older one: everything
 * written before the site had people carries no id, and matching those by
 * byline is exactly what the site has always done. What it stops doing is
 * guessing when it has been told.
 */
export function authorOfPiece(
  directory: Author[],
  piece: { authorId?: string; authorName: string }
): Author | undefined {
  if (piece.authorId) {
    const held = byId(directory, piece.authorId)
    /* An id naming somebody the directory has lost is still a better
       reason to fall back than to show nobody. */
    if (held) return held
  }
  return byName(directory, piece.authorName)
}

/** The common case: one byline, one lookup. */
export async function findAuthorByName(name: string): Promise<Author | undefined> {
  return byName(await authorDirectory(), name)
}

/** `authorOfPiece` for a single piece, when no directory is in hand. */
export async function findAuthorOfPiece(piece: {
  authorId?: string
  authorName: string
}): Promise<Author | undefined> {
  return authorOfPiece(await authorDirectory(), piece)
}
