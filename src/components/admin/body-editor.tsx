'use client'

import * as React from 'react'
import { Eye, EyeOff, ImageUp, Loader2 } from 'lucide-react'
import { scriptureRefs } from '@/lib/scripture'
import { extractHeadings } from '@/lib/toc'
import { wordCount } from '@/lib/article-body'
import { ArticleProse } from '@/components/article-prose'
import { applySnippet, GRAMMAR, SNIPPETS, type Snippet } from '@/lib/markup-snippets'
import { uploadPicture } from '@/lib/shrink-image'

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

/** Left selected in the figure so the writer types over it. Alt text is
    the one field here nothing else can fill, and a figure without it is
    read as a paragraph rather than published half-made. */
const ALT_PLACEHOLDER = 'what this picture shows'

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
  const picture = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState(false)
  const [grammar, setGrammar] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState('')

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

  /* A finished block dropped in at the cursor, with one word of it left
     selected for the writer to type over. Used by the picture button
     below: the figure arrives complete except for the alt text, which is
     the one part of it no machine can write. */
  const drop = (block: string, select?: string) => {
    const node = area.current
    if (!node) return
    const before = value.slice(0, node.selectionStart).replace(/\n*$/, '')
    const after = value.slice(node.selectionEnd).replace(/^\n*/, '')
    const head = before ? `${before}\n\n` : ''
    const text = `${head}${block}${after ? `\n\n${after}` : '\n'}`
    onChange(text)
    const at = head.length + (select ? block.indexOf(select) : block.length)
    window.requestAnimationFrame(() => {
      node.focus()
      node.setSelectionRange(at, at + (select ? select.length : 0))
    })
  }

  /* Upload a picture and write the figure that shows it.

     The `@figure` button beside this one inserts the empty opener for a
     writer who already has a path. This one is for the ordinary case:
     the picture is on the phone in their hand, and every step between
     that and a paragraph is a step at which the teaching goes out
     without it. The dimensions come back from the upload, so the page
     reserves the right space before the picture loads rather than
     jumping when it arrives. */
  const addPicture = async (file: File) => {
    setUploadError('')
    setUploading(true)
    try {
      const { url, width, height } = await uploadPicture(file)
      const size = width && height ? ` ${width}x${height}` : ''
      drop(`@figure ${url}${size} | ${ALT_PLACEHOLDER} | `, ALT_PLACEHOLDER)
    } catch (thrown) {
      setUploadError(thrown instanceof Error ? thrown.message : 'That upload failed.')
    } finally {
      setUploading(false)
    }
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

        {/* Not an opener but a picture, so it is set apart from them. */}
        <button
          type="button"
          title="Upload a picture and write the figure for it"
          disabled={uploading}
          onClick={() => picture.current?.click()}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-surface px-2.5 py-1.5 font-mono text-[0.75rem] text-gold transition-colors hover:border-gold disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImageUp className="h-3.5 w-3.5" />
          )}
          {uploading ? 'uploading…' : 'picture'}
        </button>
        <input
          ref={picture}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            /* Cleared so the same file can be chosen twice — after a
               failure, picking it again is the obvious thing to try. */
            event.target.value = ''
            if (file) void addPicture(file)
          }}
        />
      </div>

      {uploadError && (
        <p role="alert" className="mt-2 font-sans text-xs text-status-danger">
          {uploadError}
        </p>
      )}

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
