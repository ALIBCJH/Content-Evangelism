/**
 * Scripture references, pulled out of a teaching's own text.
 *
 * The design sets references as chips on a card and lists them in the
 * article rail, so they have to come from somewhere. Rather than ask a
 * writer to maintain a second list by hand — which drifts the moment the
 * body is edited — they are read out of the prose itself.
 *
 * A reference is a book name, optionally numbered, followed by a chapter
 * and optionally a verse or a range. "Matthew 24", "1 Thessalonians
 * 4:16–17", and "Acts 3:19" all match; "Isaiah" alone does not, because a
 * whole book is not a citation.
 */

const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges',
  'Ruth', 'Samuel', 'Kings', 'Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job',
  'Psalm', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah',
  'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
  'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  'Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  'Thessalonians', 'Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', 'Peter',
  'Jude', 'Revelation',
]

/* An optional leading number ("1 Thessalonians"), the book, a chapter, and
   an optional verse or range using either a hyphen or an en dash. */
const REFERENCE = new RegExp(
  String.raw`\b((?:[123]\s)?(?:${BOOKS.join('|')}))\s(\d{1,3})(?::(\d{1,3})(?:[–-](\d{1,3}))?)?`,
  'g'
)

/**
 * Every distinct reference in a body, in the order it first appears.
 * `limit` caps the list — a card shows four, a rail shows a dozen.
 */
export function scriptureRefs(body: string | undefined, limit = 12): string[] {
  if (!body) return []
  const seen = new Set<string>()
  /* A fresh RegExp per call: the global flag carries lastIndex across
     calls, so a shared instance would start the next body mid-string. */
  const pattern = new RegExp(REFERENCE.source, 'g')
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    const [, book, chapter, verse, through] = match
    const ref = verse
      ? `${book} ${chapter}:${verse}${through ? `–${through}` : ''}`
      : `${book} ${chapter}`
    seen.add(ref)
    if (seen.size >= limit) break
  }
  return Array.from(seen)
}

/** The single reference a card or a row is filed under, if there is one. */
export function primaryRef(body: string | undefined): string | null {
  return scriptureRefs(body, 1)[0] ?? null
}
