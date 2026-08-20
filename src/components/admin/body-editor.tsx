'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { scriptureRefs } from '@/lib/scripture'
import { extractHeadings } from '@/lib/toc'
import { wordCount } from '@/lib/article-body'
import { ArticleProse } from '@/components/article-prose'
import { applySnippet, GRAMMAR, SNIPPETS, type Snippet } from '@/lib/markup-snippets'

/**
 * Where a teaching is actually written.
 *
 * The body was a bare textarea with two lines of syntax under it, and the
 * grammar it was documenting had grown to eleven kinds of block. A writer
 * who wanted a table, a callout, a recording or a link to another
 * teaching had to remember the exact opener, or go and read the parser.
 *
 * So the openers are buttons that write themselves into the text at the
 * cursor, in the order a teaching tends to need them, and the full
 * grammar is one click away rather than in another file. Nothing here
 * changes what the parser accepts — these are the same characters the
 * desk was typing by hand.
 *
 * Beside them the piece counts itself: words, the reading time the site
 * will print, the chapters the contents list will hold, and the passages
 * the rail will pull out. Every one of those is derived by the same
 * function the published page uses, so what the desk sees here is what a
 * reader gets.
 */

export function BodyEditor({
  value,
  onChange,
  className = '',
}: {
  value: string
  onChange: (next: string) => void
  className?: string
}) {
  const area = React.useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = React.useState(false)
  const [grammar, setGrammar] = React.useState(false)

  /* Put the snippet in at the cursor, keep any selected text inside it,
     and leave the cursor where the writing continues. */
  const insert = (snippet: Snippet) => {
    const node = area.current
    if (!node) return
    const { text, caret } = applySnippet(value, node.selectionStart, node.selectionEnd, snippet)
    onChange(text)
    window.requestAnimationFrame(() => {
      node.focus()
      node.setSelectionRange(caret, caret)
    })
  }

  const words = value.trim() ? wordCount(value) : 0
  const minutes = Math.max(1, Math.round(words / 200))
  const chapters = extractHeadings(value).length
  const passages = scriptureRefs(value, 200)

  const field =
    'focus-ring w-full rounded-2xl border border-hairline bg-surface px-4 py-3 font-mono text-[0.8125rem] leading-[1.7] text-ink-strong placeholder:text-ink-subtle'

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <label
          htmlFor="a-body"
          className="font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted"
        >
          Article body
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setGrammar((open) => !open)}
            className="focus-ring font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
          >
            {grammar ? 'Hide the grammar' : 'The grammar'}
          </button>
          <button
            type="button"
            onClick={() => setPreview((on) => !on)}
            className="focus-ring inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
          >
            {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {preview ? 'Hide preview' : 'Preview'}
          </button>
        </div>
      </div>

      {/* The openers, in the order a teaching tends to want them. */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SNIPPETS.map((snippet) => (
          <button
            key={snippet.label}
            type="button"
            title={snippet.title}
            onClick={() => insert(snippet)}
            className="focus-ring rounded-lg border border-hairline bg-surface px-2.5 py-1.5 font-mono text-[0.75rem] text-ink-muted transition-colors hover:border-gold/60 hover:text-gold"
          >
            {snippet.label}
          </button>
        ))}
      </div>

      {grammar && (
        <dl className="mt-3 grid gap-x-6 gap-y-3 rounded-2xl border border-hairline bg-surface px-4 py-4 sm:grid-cols-2">
          {GRAMMAR.map((row) => (
            <div key={row.what}>
              <dt className="font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-ink-muted">
                {row.what}
              </dt>
              <dd className="mt-1 whitespace-pre-wrap font-mono text-[0.75rem] leading-[1.6] text-gold">
                {row.how}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Side by side once the preview is on, so the writer keeps the text
          they are editing rather than trading it for the picture of it. */}
      <div className={`mt-3 ${preview ? 'grid gap-4 xl:grid-cols-2' : ''}`}>
        <textarea
          id="a-body"
          ref={area}
          required
          minLength={50}
          rows={preview ? 24 : 16}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={'The opening paragraph…\n\n## A chapter\n\nThe next paragraph…'}
          className={field}
        />
        {preview && (
          <div className="max-h-[36rem] overflow-y-auto rounded-2xl border border-hairline bg-surface px-5 py-4">
            {value.trim() ? (
              <ArticleProse body={value} />
            ) : (
              <p className="font-sans text-xs text-ink-subtle">
                Nothing to show yet. What you type appears here as a reader will see it.
              </p>
            )}
          </div>
        )}
      </div>

      {/* What the piece is, counted by the same functions the published
          page uses — so a chapter missing here is a chapter missing on the
          site, and a reference the rail will not pull is one it cannot
          find in this text either. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-sans text-xs text-ink-subtle">
        <span>
          <span className="tabular text-ink-muted">{words.toLocaleString()}</span> words
        </span>
        <span>
          <span className="tabular text-ink-muted">{minutes}</span> min read
        </span>
        <span>
          <span className="tabular text-ink-muted">{chapters}</span>{' '}
          {chapters === 1 ? 'chapter' : 'chapters'}
        </span>
        <span>
          <span className="tabular text-ink-muted">{passages.length}</span>{' '}
          {passages.length === 1 ? 'passage' : 'passages'}
          {passages.length > 0 && (
            <span className="ml-1.5 font-mono text-[0.6875rem] text-gold">
              {passages.slice(0, 4).join(' · ')}
              {passages.length > 4 ? ' …' : ''}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
