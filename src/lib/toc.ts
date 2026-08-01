/** Chapter extraction for the study margin — one source of truth for
 *  heading ids so the rail's links always match the rendered h2s. */

export interface Heading {
  id: string
  text: string
}

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’'".,:;!?()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

/** All `## ` subheadings of a plain-text article body, in order. */
export function extractHeadings(body: string): Heading[] {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.startsWith('## '))
    .map((block) => {
      const text = block.slice(3).trim()
      return { id: headingId(text), text }
    })
}
