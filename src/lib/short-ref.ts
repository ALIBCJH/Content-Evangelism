/**
 * A passage reference at the size a thumbnail actually is.
 *
 * The citation a teaching prints under its opening quotation is written
 * for the page — "Matthew 3:2 and Matthew 4:17, KJV" — and set into a
 * hundred-pixel square it wraps to three lines and spills out of its own
 * field. What a mark on a listing row needs is the shortest thing that
 * still says which passage: the book, the chapter, the verse.
 *
 * So: the translation goes, a second reference goes, and the longer book
 * names are abbreviated the way a printed Bible abbreviates them.
 */

/** Books whose full name will not sit on a line at this size. */
const SHORT: Record<string, string> = {
  thessalonians: 'Thess.',
  corinthians: 'Cor.',
  philippians: 'Phil.',
  colossians: 'Col.',
  ecclesiastes: 'Eccl.',
  lamentations: 'Lam.',
  deuteronomy: 'Deut.',
  revelation: 'Rev.',
  chronicles: 'Chron.',
  ephesians: 'Eph.',
  galatians: 'Gal.',
  philemon: 'Phlm.',
  zephaniah: 'Zeph.',
  habakkuk: 'Hab.',
  zechariah: 'Zech.',
  jeremiah: 'Jer.',
  proverbs: 'Prov.',
  numbers: 'Num.',
  genesis: 'Gen.',
  matthew: 'Matt.',
  romans: 'Rom.',
}

export function shortRef(cite: string | undefined): string | undefined {
  if (!cite) return undefined

  let text = cite.trim().replace(/^[—–-]\s*/, '')
  /* The translation is not part of the address. It is the same one on
     nearly every teaching here, so it distinguishes nothing and costs a
     line. */
  text = text.replace(/,\s*(KJV|NIV|ESV|NKJV|NLT|NASB|RSV|ASV|AMP|MSG)\b.*$/i, '')
  /* A teaching that opens on two passages is still filed under the
     first: "Matthew 3:2 and Matthew 4:17" is one mark, not two. */
  text = text.split(/\s+(?:and|&|;)\s+/i)[0].trim().replace(/[,;]+$/, '')

  const shortened = text.replace(
    /\b([1-3]\s*)?([A-Za-z]{4,})\b/,
    (whole, ordinal: string | undefined, book: string) => {
      const abbreviation = SHORT[book.toLowerCase()]
      if (!abbreviation) return whole
      return `${ordinal ? `${ordinal.trim()} ` : ''}${abbreviation}`
    }
  )

  return shortened || undefined
}
