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
 * A teaching that sets two things side by side, quotes a statement of
 * faith, or carries a recording needs three more blocks, and they stay as
 * typeable as the rest:
 *
 *   |+ How Scripture describes each      (optional caption)
 *   | | The rapture | The second coming  (the header row)
 *   | Who sees Him | Those who are His | Every eye (Rev 1:7)
 *
 *   ::statement From the ministry's statement of faith
 *   :: The rapture is described as the imminent return of Christ…
 *   :: — Ministry of Repentance and Holiness
 *
 *   @video 29PZpK0CKts | Title | Prophet Dr. David Edward Owuor | Watch · 20 seconds
 *
 * A teaching that answers the questions readers actually type carries them
 * at the foot, where the devotional has ended and the apparatus begins:
 *
 *   ?? What does Hebrews 12:14 mean?
 *   ?: It instructs believers to pursue peace with all men and holiness…
 *
 * Consecutive question blocks gather into one section, so they are set as
 * a single list rather than as scattered pairs, and the same pairs are
 * what the page emits as FAQPage structured data.
 *
 * A callout's tone is one of `statement` (the ministry speaking for
 * itself), `source` (an editorial block: this cannot publish as it
 * stands), or `note` (a quiet aside beside the running text).
 *
 * Anything else is a paragraph, so every article written before this
 * shipped renders exactly as it did.
 */

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'em'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'link'; text: string; href: string }

export type CalloutTone = 'statement' | 'source' | 'note'

export type Block =
  | { kind: 'heading'; id: string; text: string }
  | { kind: 'paragraph'; inlines: Inline[] }
  | { kind: 'quote'; inlines: Inline[]; cite?: string }
  | { kind: 'list'; ordered: boolean; items: Inline[][] }
  | { kind: 'table'; caption?: string; head: string[]; rows: string[][] }
  | { kind: 'callout'; tone: CalloutTone; label?: string; inlines: Inline[]; cite?: string }
  | { kind: 'video'; id: string; title: string; byline?: string; eyebrow?: string }
  | { kind: 'faq'; items: FaqItem[] }

export interface FaqItem {
  q: string
  a: string
}

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
const TONES: CalloutTone[] = ['statement', 'source', 'note']

/** "| a | b | c" → ["a", "b", "c"], with the outer pipes discarded. */
function cells(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

export function parseBody(body: string): Block[] {
  const raw = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  const blocks = raw.map((block): Block => {
    if (block.startsWith('## ')) {
      const text = block.slice(3).trim()
      return { kind: 'heading', id: headingId(text), text }
    }

    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)

    /* A recording, set into the teaching where it is referred to. */
    if (lines.length === 1 && lines[0].startsWith('@video ')) {
      const [id, title, byline, eyebrow] = cells(lines[0].slice(7)).map((part) => part.trim())
      if (id && title) {
        return {
          kind: 'video',
          id,
          title,
          ...(byline ? { byline } : {}),
          ...(eyebrow ? { eyebrow } : {}),
        }
      }
    }

    /* Two columns set side by side. The first row is the header; a leading
       `|+` line is the caption above it. */
    if (lines.every((line) => line.startsWith('|'))) {
      const caption = lines[0].startsWith('|+') ? lines[0].slice(2).trim() : undefined
      const body = caption ? lines.slice(1) : lines
      const [head, ...rest] = body.map(cells)
      if (head && rest.length > 0) {
        return { kind: 'table', ...(caption ? { caption } : {}), head, rows: rest }
      }
    }

    /* A question and its answer. `?? ` opens the question, `?: ` carries
       the answer, which may run over several lines. */
    if (lines[0]?.startsWith('?? ') && lines.every((line) => /^\?[?:]\s/.test(line))) {
      const q = lines[0].slice(3).trim()
      const a = lines
        .slice(1)
        .map((line) => line.slice(3).trim())
        .join(' ')
        .trim()
      if (q && a) return { kind: 'faq', items: [{ q, a }] }
    }

    /* A labelled panel. The tone decides what it is and how it reads. */
    if (lines.every((line) => line.startsWith('::'))) {
      const opener = lines[0].slice(2).trim()
      const tone = TONES.find(
        (candidate) => opener === candidate || opener.startsWith(`${candidate} `)
      )
      if (tone) {
        const label = opener.slice(tone.length).trim() || undefined
        const rest = lines.slice(1).map((line) => line.replace(/^::\s?/, ''))
        const last = rest[rest.length - 1] ?? ''
        const hasCite = rest.length > 1 && /^[—–-]\s*\S/.test(last)
        const cite = hasCite ? last.replace(/^[—–-]\s*/, '') : undefined
        const text = (hasCite ? rest.slice(0, -1) : rest).join(' ')
        return {
          kind: 'callout',
          tone,
          ...(label ? { label } : {}),
          inlines: parseInline(text),
          ...(cite ? { cite } : {}),
        }
      }
    }

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

  /* Questions written one after another are one section, not several. */
  return blocks.reduce<Block[]>((out, block) => {
    const previous = out[out.length - 1]
    if (block.kind === 'faq' && previous?.kind === 'faq') {
      previous.items.push(...block.items)
      return out
    }
    return [...out, block]
  }, [])
}

/** The question-and-answer pairs, for FAQPage structured data. */
export function extractFaqs(body: string | undefined): FaqItem[] {
  if (!body) return []
  return parseBody(body).flatMap((block) => (block.kind === 'faq' ? block.items : []))
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
        case 'callout':
          return [inlineText(block.inlines), block.cite].filter(Boolean).join(' — ')
        case 'table':
          return [block.caption, block.head.join(' · '), ...block.rows.map((r) => r.join(' · '))]
            .filter(Boolean)
            .join('\n')
        case 'video':
          return [block.title, block.byline].filter(Boolean).join(' — ')
        case 'faq':
          /* The questions are part of the page a reader searches, so they
             belong in the haystack and in the word count. */
          return block.items.map(({ q, a }) => `${q} ${a}`).join('\n')
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
        case 'callout': {
          const label = block.label ? `<strong>${escapeXml(block.label)}</strong><br />` : ''
          const cite = block.cite ? `<br /><cite>${escapeXml(block.cite)}</cite>` : ''
          return `<blockquote><p>${label}${inlineHtml(block.inlines, origin)}${cite}</p></blockquote>`
        }
        case 'table': {
          const caption = block.caption ? `<caption>${escapeXml(block.caption)}</caption>` : ''
          const head = block.head.map((cell) => `<th>${escapeXml(cell)}</th>`).join('')
          const rows = block.rows
            .map((row) => `<tr>${row.map((cell) => `<td>${escapeXml(cell)}</td>`).join('')}</tr>`)
            .join('')
          return `<table>${caption}<thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`
        }
        case 'video': {
          /* A feed reader cannot play an embed, so it gets the link. */
          const href = `https://www.youtube.com/watch?v=${escapeXml(block.id)}`
          const byline = block.byline ? ` — ${escapeXml(block.byline)}` : ''
          return `<p><a href="${href}">${escapeXml(block.title)}</a>${byline}</p>`
        }
        case 'faq':
          /* A definition list is what this is, and it survives the trip
             into a reader that strips everything it does not know. */
          return `<dl>${block.items
            .map(({ q, a }) => `<dt>${escapeXml(q)}</dt><dd>${escapeXml(a)}</dd>`)
            .join('')}</dl>`
        default:
          return `<p>${inlineHtml(block.inlines, origin)}</p>`
      }
    })
    .join('\n')
}
