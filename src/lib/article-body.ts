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
 *   @video wide O0Yw0HKTc1k | Title | Prophet Dr. David Edward Owuor | Watch · 8 minutes
 *
 *   @diagram prophetic-timeline | The timeline as commonly taught
 *   @figure /images/articles/x.jpg 1600x1067 | What it shows | A caption
 *
 * A short is filmed upright and takes the narrow frame the block was
 * built for; a sermon is filmed landscape, and `wide` gives it the 16:9
 * frame rather than letterboxing an hour of preaching into a column.
 *
 * A figure is a photograph, set into the teaching where it belongs rather
 * than at the head of the page. Alt text is not optional: a body that can
 * carry a photograph can carry one nobody can see, and the second field is
 * what a reader on a screen reader is given instead of it.
 *
 * The `WxH` after the path is the file's own pixel size, and it is what
 * the page reserves before the photograph arrives. Without it a portrait
 * is held a landscape's worth of space and the paragraph under it jumps
 * when the picture lands — on the reader's phone, mid-sentence.
 *
 * A diagram names a drawing the site holds rather than a file it serves.
 * A prophetic sequence is a picture before it is a paragraph, and a
 * screenshot of one is a picture the reader cannot search, a screen
 * reader cannot read, and the dark theme cannot follow — so the drawings
 * are drawn in the page, in the palette the page is already using, and a
 * body asks for one by name.
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
  | { kind: 'video'; id: string; title: string; byline?: string; eyebrow?: string; wide?: boolean }
  | { kind: 'diagram'; name: string; caption?: string }
  | { kind: 'figure'; src: string; alt: string; width?: number; height?: number; caption?: string }
  | { kind: 'faq'; items: FaqItem[] }
  | { kind: 'related'; slugs: string[] }

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

    /* A recording, set into the teaching where it is referred to. The id
       may be preceded by `wide`, which is how a landscape sermon says it
       is not a short and must not be set in the upright frame. */
    if (lines.length === 1 && lines[0].startsWith('@video ')) {
      const [opener, title, byline, eyebrow] = cells(lines[0].slice(7)).map((part) => part.trim())
      const wide = /^wide\s+/i.test(opener ?? '')
      const id = wide ? opener.replace(/^wide\s+/i, '').trim() : opener
      if (id && title) {
        return {
          kind: 'video',
          id,
          title,
          ...(wide ? { wide: true } : {}),
          ...(byline ? { byline } : {}),
          ...(eyebrow ? { eyebrow } : {}),
        }
      }
    }

    /* A photograph the site serves. It needs a path this site owns and
       alt text; without either it is not a figure, and falls through to
       being read as a paragraph rather than published half-made. */
    if (lines.length === 1 && lines[0].startsWith('@figure ')) {
      const [head, alt, caption] = cells(lines[0].slice(8)).map((part) => part.trim())
      const [src, size] = (head ?? '').split(/\s+/)
      const shape = size?.match(/^(\d+)x(\d+)$/)
      if (src?.startsWith('/') && alt) {
        return {
          kind: 'figure',
          src,
          alt,
          ...(shape ? { width: Number(shape[1]), height: Number(shape[2]) } : {}),
          ...(caption ? { caption } : {}),
        }
      }
    }

    /* A drawing the site holds, named rather than linked. An unknown
       name renders as nothing at all rather than as a broken frame. */
    if (lines.length === 1 && lines[0].startsWith('@diagram ')) {
      const [name, caption] = cells(lines[0].slice(9)).map((part) => part.trim())
      if (name) return { kind: 'diagram', name, ...(caption ? { caption } : {}) }
    }

    /* Other teachings, named by slug and set into the reading where the
       tangent actually comes up, rather than left to the foot of the page
       where most readers never arrive. Three is the ceiling: this is an
       aside inside a teaching, not a second archive. A slug the site does
       not hold is dropped when it renders, so a withdrawn teaching leaves
       no broken row behind it. */
    if (lines.length === 1 && lines[0].startsWith('@related ')) {
      const slugs = cells(lines[0].slice(9))
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 3)
      if (slugs.length > 0) return { kind: 'related', slugs }
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
        case 'diagram':
          /* The drawing carries its own labels, which a reader searching
             for "millennial reign" is entitled to match on; the caption
             is the part this side of the parser can see. */
          return block.caption ?? ''
        case 'figure':
          return [block.caption, block.alt].filter(Boolean).join(' ')
        case 'faq':
          /* The questions are part of the page a reader searches, so they
             belong in the haystack and in the word count. */
          return block.items.map(({ q, a }) => `${q} ${a}`).join('\n')
        case 'related':
          /* Navigation, not the teaching: the titles belong to other
             pieces, and counting them here would have a search for one
             teaching match every teaching that points at it. */
          return ''
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
        case 'diagram': {
          /* A feed reader cannot draw the diagram, and the teaching sets
             the same sequence out as a table directly beneath it — so the
             caption goes across and nothing essential is lost. */
          return block.caption ? `<p><em>${escapeXml(block.caption)}</em></p>` : ''
        }
        case 'figure': {
          /* A feed is read off-site, so the photograph needs an absolute
             source or it resolves against the reader's own host. */
          const caption = block.caption
            ? `<figcaption>${escapeXml(block.caption)}</figcaption>`
            : ''
          return `<figure><img src="${escapeXml(origin + block.src)}" alt="${escapeXml(
            block.alt
          )}" />${caption}</figure>`
        }
        case 'faq':
          /* A definition list is what this is, and it survives the trip
             into a reader that strips everything it does not know. */
          return `<dl>${block.items
            .map(({ q, a }) => `<dt>${escapeXml(q)}</dt><dd>${escapeXml(a)}</dd>`)
            .join('')}</dl>`
        case 'related':
          /* A feed carries the teaching, not the site's furniture — and
             the parser holds slugs rather than titles, so the honest
             rendering here is none at all. */
          return ''
        default:
          return `<p>${inlineHtml(block.inlines, origin)}</p>`
      }
    })
    .join('\n')
}
