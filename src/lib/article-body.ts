import { headingId } from '@/lib/toc'

/**
 * The article body grammar.
 *
 * Bodies are authored as plain text in the posting desk, so the grammar
 * stays typeable: a blank line separates blocks, and a block's first
 * characters decide what it is. The renderer used to understand only
 * paragraphs and `## ` headings, which left writers no way to quote
 * Scripture, set out a list, or link to another teaching — and a body that
 * cannot carry a link is a body that contributes nothing to internal
 * linking, which is most of what moves a small site in search.
 *
 *   ## Subheading
 *   > Quoted line
 *   > — Isaiah 40:3          (a closing "— " line becomes the citation)
 *   - bullet   |   1. numbered
 *   [text](/articles/slug) **strong** *emphasis*
 *
 * Anything else is a paragraph, so every article written before this
 * shipped renders exactly as it did.
 */

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'em'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'link'; text: string; href: string }

export type Block =
  | { kind: 'heading'; id: string; text: string }
  | { kind: 'paragraph'; inlines: Inline[] }
  | { kind: 'quote'; inlines: Inline[]; cite?: string }
  | { kind: 'list'; ordered: boolean; items: Inline[][] }

/* ── Inline ──────────────────────────────────────────────────────── */

const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g

/**
 * Only site-relative paths and http(s)/mailto links are allowed through.
 * Bodies come from the posting desk, but a scheme filter here means a
 * pasted `javascript:` URL can never become a live href.
 */
function safeHref(href: string): string | null {
  if (href.startsWith('/') || href.startsWith('#')) return href
  return /^(https?:|mailto:)/i.test(href) ? href : null
}

export function parseInline(text: string): Inline[] {
  const inlines: Inline[] = []
  let cursor = 0

  INLINE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = INLINE.exec(text)) !== null) {
    const at = match.index
    if (at > cursor) inlines.push({ kind: 'text', text: text.slice(cursor, at) })

    const [raw, linkText, linkHref, strong, star, underscore] = match
    if (linkText && linkHref) {
      const href = safeHref(linkHref)
      inlines.push(href ? { kind: 'link', text: linkText, href } : { kind: 'text', text: linkText })
    } else if (strong) {
      inlines.push({ kind: 'strong', text: strong })
    } else {
      inlines.push({ kind: 'em', text: (star ?? underscore) as string })
    }
    cursor = at + raw.length
  }

  if (cursor < text.length) inlines.push({ kind: 'text', text: text.slice(cursor) })
  return inlines.length > 0 ? inlines : [{ kind: 'text', text }]
}

/* ── Blocks ──────────────────────────────────────────────────────── */

const BULLET = /^[-*•]\s+/
const NUMBERED = /^\d+[.)]\s+/

export function parseBody(body: string): Block[] {
  const raw = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  return raw.map((block): Block => {
    if (block.startsWith('## ')) {
      const text = block.slice(3).trim()
      return { kind: 'heading', id: headingId(text), text }
    }

    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)

    if (lines.every((line) => line.startsWith('>'))) {
      const quoted = lines.map((line) => line.replace(/^>\s?/, ''))
      const last = quoted[quoted.length - 1] ?? ''
      // A closing "— Reference" line is the attribution, not the quote.
      const hasCite = quoted.length > 1 && /^[—–-]\s*\S/.test(last)
      const cite = hasCite ? last.replace(/^[—–-]\s*/, '') : undefined
      const text = (hasCite ? quoted.slice(0, -1) : quoted).join(' ')
      return { kind: 'quote', inlines: parseInline(text), ...(cite ? { cite } : {}) }
    }

    if (lines.length > 0 && lines.every((line) => BULLET.test(line))) {
      return {
        kind: 'list',
        ordered: false,
        items: lines.map((line) => parseInline(line.replace(BULLET, ''))),
      }
    }

    if (lines.length > 0 && lines.every((line) => NUMBERED.test(line))) {
      return {
        kind: 'list',
        ordered: true,
        items: lines.map((line) => parseInline(line.replace(NUMBERED, ''))),
      }
    }

    return { kind: 'paragraph', inlines: parseInline(block) }
  })
}

/* ── Derived values for structured data and feeds ────────────────── */

const inlineText = (inlines: Inline[]): string => inlines.map((i) => i.text).join('')

/** The article as running prose — feeds `articleBody` and `wordCount`. */
export function bodyToPlainText(body: string): string {
  return parseBody(body)
    .map((block) => {
      switch (block.kind) {
        case 'heading':
          return block.text
        case 'list':
          return block.items.map(inlineText).join(' ')
        case 'quote':
          return [inlineText(block.inlines), block.cite].filter(Boolean).join(' — ')
        default:
          return inlineText(block.inlines)
      }
    })
    .join('\n\n')
}

export function wordCount(body: string): number {
  return bodyToPlainText(body).split(/\s+/).filter(Boolean).length
}

/* ── HTML, for the feed ──────────────────────────────────────────── */

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function inlineHtml(inlines: Inline[], origin: string): string {
  return inlines
    .map((inline) => {
      const text = escapeXml(inline.text)
      switch (inline.kind) {
        case 'strong':
          return `<strong>${text}</strong>`
        case 'em':
          return `<em>${text}</em>`
        case 'link': {
          // Feed items are read off-site, so relative links must be absolute.
          const href = inline.href.startsWith('/') ? `${origin}${inline.href}` : inline.href
          return `<a href="${escapeXml(href)}">${text}</a>`
        }
        default:
          return text
      }
    })
    .join('')
}

/** Renders a body as the HTML that goes inside `content:encoded`. */
export function bodyToHtml(body: string, origin: string): string {
  return parseBody(body)
    .map((block) => {
      switch (block.kind) {
        case 'heading':
          return `<h2>${escapeXml(block.text)}</h2>`
        case 'quote': {
          const cite = block.cite ? `<cite>${escapeXml(block.cite)}</cite>` : ''
          return `<blockquote><p>${inlineHtml(block.inlines, origin)}</p>${cite}</blockquote>`
        }
        case 'list': {
          const tag = block.ordered ? 'ol' : 'ul'
          const items = block.items.map((item) => `<li>${inlineHtml(item, origin)}</li>`).join('')
          return `<${tag}>${items}</${tag}>`
        }
        default:
          return `<p>${inlineHtml(block.inlines, origin)}</p>`
      }
    })
    .join('\n')
}
