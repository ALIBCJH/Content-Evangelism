'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import {
  ArrowRight, Check, Eye, EyeOff, Feather, LoaderCircle,
  Pencil, Trash2, X,
} from 'lucide-react'
import { CATEGORIES } from '@/lib/content'
import { cn } from '@/lib/utils'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ManagedArticle {
  slug: string
  title: string
  dek: string
  category: string
  authorName: string
  body: string
  imageUrl?: string
  publishedAt: string
  readMinutes: number
}

const fieldLabel = 'kicker block text-ink-subtle'
const textareaClass =
  'focus-ring mt-2 w-full rounded-2xl border border-hairline-strong bg-surface px-5 py-4 font-serif text-base leading-relaxed text-ink placeholder:text-ink-subtle transition-colors focus:border-gold/60'
const tabClass = (active: boolean) =>
  cn(
    'focus-ring rounded-full px-5 py-2 font-sans text-xs font-bold uppercase tracking-kicker transition-colors',
    active ? 'bg-gold text-navy-900' : 'text-ink-muted hover:bg-surface-2 hover:text-ink-strong'
  )

/** Client-side render of the body format: blank line = ¶, "## " = subheading. */
function BodyPreview({ body }: { body: string }) {
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  let seenParagraph = false
  return (
    <>
      {blocks.map((block, index) => {
        if (block.startsWith('## ')) {
          return (
            <h3 key={index} className="mt-8 font-display text-xl font-semibold text-ink-strong">
              {block.slice(3)}
            </h3>
          )
        }
        const isFirst = !seenParagraph
        seenParagraph = true
        return (
          <p key={index} className={cn('mt-4 font-serif text-base leading-[1.8] text-ink-muted', isFirst && 'dropcap')}>
            {block}
          </p>
        )
      })}
    </>
  )
}

export default function AdminPage() {
  const [tab, setTab] = React.useState<'write' | 'manage'>('write')

  /* Form state */
  const [editingSlug, setEditingSlug] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState('')
  const [category, setCategory] = React.useState<string>(CATEGORIES[0])
  const [dek, setDek] = React.useState('')
  const [body, setBody] = React.useState('')
  const [authorName, setAuthorName] = React.useState('')
  const [imageUrl, setImageUrl] = React.useState('')
  const [postingKey, setPostingKey] = React.useState('')
  const [showPreview, setShowPreview] = React.useState(false)
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = React.useState<string | null>(null)

  /* Manage state */
  const [articles, setArticles] = React.useState<ManagedArticle[]>([])
  const [loadingList, setLoadingList] = React.useState(false)
  const [manageError, setManageError] = React.useState<string | null>(null)
  const [deletingSlug, setDeletingSlug] = React.useState<string | null>(null)

  const loadArticles = React.useCallback(async () => {
    setLoadingList(true)
    setManageError(null)
    try {
      const res = await fetch('/api/articles', { cache: 'no-store' })
      const json = await res.json()
      setArticles(json.articles ?? [])
    } catch {
      setManageError('Could not load the article list.')
    } finally {
      setLoadingList(false)
    }
  }, [])

  React.useEffect(() => {
    if (tab === 'manage') loadArticles()
  }, [tab, loadArticles])

  const clearForm = () => {
    setEditingSlug(null)
    setTitle(''); setDek(''); setBody(''); setImageUrl(''); setAuthorName('')
    setPublishedUrl(null); setStatus('idle'); setError(null); setShowPreview(false)
  }

  const startEdit = (article: ManagedArticle) => {
    setEditingSlug(article.slug)
    setTitle(article.title)
    setCategory(article.category)
    setDek(article.dek)
    setBody(article.body)
    setAuthorName(article.authorName)
    setImageUrl(article.imageUrl ?? '')
    setStatus('idle'); setError(null); setPublishedUrl(null)
    setTab('write')
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setStatus('saving')
    try {
      const endpoint = editingSlug ? `/api/articles/${editingSlug}` : '/api/articles'
      const res = await fetch(endpoint, {
        method: editingSlug ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${postingKey}`,
        },
        body: JSON.stringify({ title, category, dek, body, authorName, imageUrl }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong.')
        setStatus('idle')
        return
      }
      setPublishedUrl(json.url)
      setStatus('done')
    } catch {
      setError('Could not reach the server.')
      setStatus('idle')
    }
  }

  const onDelete = async (slug: string) => {
    if (!postingKey) {
      setManageError('Enter the posting key above first — deleting requires it.')
      return
    }
    if (!window.confirm('Remove this article permanently?')) return
    setDeletingSlug(slug)
    setManageError(null)
    try {
      const res = await fetch(`/api/articles/${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${postingKey}` },
      })
      const json = await res.json()
      if (!res.ok) {
        setManageError(json.error ?? 'Delete failed.')
      } else {
        setArticles((current) => current.filter((a) => a.slug !== slug))
      }
    } catch {
      setManageError('Could not reach the server.')
    } finally {
      setDeletingSlug(null)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <header className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-gold/10">
            <Feather className="h-5 w-5 text-gold" strokeWidth={1.5} />
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold text-ink-strong md:text-4xl">
            The Posting Desk
          </h1>
          <div className="mt-6 inline-flex gap-1 rounded-full border border-hairline p-1">
            <button type="button" onClick={() => setTab('write')} className={tabClass(tab === 'write')}>
              {editingSlug ? 'Editing' : 'Write'}
            </button>
            <button type="button" onClick={() => setTab('manage')} className={tabClass(tab === 'manage')}>
              Manage
            </button>
          </div>
        </header>

        {/* ── WRITE ─────────────────────────────────────────────── */}
        {tab === 'write' && (
          status === 'done' ? (
            <div className="card mt-10 !rounded-2xl p-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-status-success/15">
                <Check className="h-6 w-6 text-status-success" />
              </span>
              <p className="mt-4 font-display text-2xl font-semibold text-ink-strong">
                {editingSlug ? 'Updated.' : 'Published.'}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {publishedUrl && (
                  <Link href={publishedUrl} className="inline-flex">
                    <span className="focus-ring inline-flex h-10 items-center gap-2 rounded-full bg-gold px-6 font-sans text-sm font-semibold text-navy-900 transition-all hover:bg-gold-light">
                      Read it now
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                )}
                <Button variant="outline" onClick={clearForm}>Write another</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="card mt-10 space-y-6 !rounded-2xl p-6 sm:p-8">
              {editingSlug && (
                <div className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
                  <p className="font-sans text-xs font-bold uppercase tracking-kicker text-gold">
                    Editing: {editingSlug}
                  </p>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="focus-ring inline-flex items-center gap-1 font-sans text-xs font-semibold text-ink-muted hover:text-ink-strong"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              )}

              <div>
                <label htmlFor="a-title" className={fieldLabel}>Title</label>
                <Input
                  id="a-title" required minLength={3} value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The title of the article" className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="a-category" className={fieldLabel}>Category</label>
                  <select
                    id="a-category" value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="focus-ring mt-2 h-11 w-full rounded-full border border-hairline-strong bg-surface px-5 font-sans text-sm text-ink transition-colors focus:border-gold/60"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-panel text-ink">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="a-author" className={fieldLabel}>Author (optional)</label>
                  <Input
                    id="a-author" value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="The Editorial Desk" className="mt-2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="a-dek" className={fieldLabel}>Summary (shown under the title)</label>
                <textarea
                  id="a-dek" required minLength={10} rows={3} value={dek}
                  onChange={(e) => setDek(e.target.value)}
                  placeholder="One or two sentences that invite the reader in…"
                  className={textareaClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="a-body" className={fieldLabel}>Article body</label>
                  <button
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                    className="focus-ring inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
                  >
                    {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showPreview ? 'Hide preview' : 'Preview'}
                  </button>
                </div>
                <textarea
                  id="a-body" required minLength={50} rows={14} value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={'The opening paragraph…\n\n## A Subheading\n\nThe next paragraph…'}
                  className={textareaClass}
                />
                <p className="mt-2 font-sans text-xs text-ink-subtle">
                  Blank line = new paragraph · start a line with <code className="text-gold">## </code> for a subheading.
                </p>
              </div>

              {showPreview && (title || dek || body) && (
                <div className="rounded-2xl border border-hairline bg-surface p-6">
                  <p className="kicker text-gold">Preview</p>
                  {title && (
                    <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-ink-strong">
                      {title}
                    </h2>
                  )}
                  {dek && (
                    <p className="mt-3 font-serif text-base italic leading-relaxed text-ink-muted">{dek}</p>
                  )}
                  {body && <BodyPreview body={body} />}
                </div>
              )}

              <div>
                <label htmlFor="a-image" className={fieldLabel}>Image URL (optional)</label>
                <Input
                  id="a-image" value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://… or /images/…" className="mt-2"
                />
              </div>

              <div className="border-t border-hairline pt-6">
                <label htmlFor="a-key" className={fieldLabel}>Posting key</label>
                <Input
                  id="a-key" type="password" required value={postingKey}
                  onChange={(e) => setPostingKey(e.target.value)}
                  placeholder="The admin posting key" className="mt-2"
                  autoComplete="current-password"
                />
                {error && (
                  <p role="alert" className="mt-3 font-sans text-sm text-status-danger">{error}</p>
                )}
                <Button type="submit" size="lg" disabled={status === 'saving'} className="mt-5 w-full sm:w-auto">
                  {status === 'saving' ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      {editingSlug ? 'Saving…' : 'Publishing…'}
                    </>
                  ) : editingSlug ? 'Save changes' : 'Publish the article'}
                </Button>
              </div>
            </form>
          )
        )}

        {/* ── MANAGE ────────────────────────────────────────────── */}
        {tab === 'manage' && (
          <div className="card mt-10 !rounded-2xl p-6 sm:p-8">
            <label htmlFor="m-key" className={fieldLabel}>Posting key (needed to delete)</label>
            <Input
              id="m-key" type="password" value={postingKey}
              onChange={(e) => setPostingKey(e.target.value)}
              placeholder="The admin posting key" className="mt-2 max-w-sm"
              autoComplete="current-password"
            />
            {manageError && (
              <p role="alert" className="mt-3 font-sans text-sm text-status-danger">{manageError}</p>
            )}

            <div className="mt-6 border-t border-hairline">
              {loadingList ? (
                <p className="flex items-center gap-2 py-8 font-sans text-sm text-ink-muted">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading the archive…
                </p>
              ) : articles.length === 0 ? (
                <p className="py-8 text-center font-serif text-base text-ink-muted">
                  Nothing published from the desk yet — write the first piece.
                </p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {articles.map((article) => (
                    <li key={article.slug} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold leading-snug text-ink-strong">
                          {article.title}
                        </p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
                          <Badge variant="outline" size="sm">{article.category}</Badge>
                          {formatDistanceToNowStrict(parseISO(article.publishedAt), { addSuffix: true })}
                          <span>· {article.readMinutes} min</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="focus-ring inline-flex h-9 items-center rounded-full border border-hairline px-4 font-sans text-xs font-semibold text-ink-muted transition-colors hover:border-gold/50 hover:text-gold"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEdit(article)}
                          className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-hairline px-4 font-sans text-xs font-semibold text-ink-muted transition-colors hover:border-gold/50 hover:text-gold"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(article.slug)}
                          disabled={deletingSlug === article.slug}
                          className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-hairline px-4 font-sans text-xs font-semibold text-ink-muted transition-colors hover:border-status-danger/60 hover:text-status-danger disabled:opacity-50"
                        >
                          {deletingSlug === article.slug ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
