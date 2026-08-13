'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import {
  ArrowRight, BookOpen, Check, Eye, EyeOff, Feather, KeyRound,
  LayoutDashboard, Layers, LoaderCircle, Pencil, PenLine, Search,
  Trash2, X,
} from 'lucide-react'
import { CATEGORIES } from '@/lib/content'
import { cn } from '@/lib/utils'
import { ArticleProse } from '@/components/article-prose'
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
  imageAlt?: string
  publishedAt: string
  readMinutes: number
}

type Tab = 'dashboard' | 'write' | 'manage'

const fieldLabel = 'kicker block text-ink-subtle'
const textareaClass =
  'focus-ring mt-2 w-full rounded-2xl border border-hairline-strong bg-surface px-5 py-4 font-serif text-base leading-relaxed text-ink placeholder:text-ink-subtle transition-colors focus:border-gold/60'

function ago(iso: string): string {
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true })
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card !rounded-2xl p-5">
      <p className="kicker text-ink-subtle">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink-strong">{value}</p>
      {hint && <p className="mt-1 font-sans text-xs text-ink-subtle">{hint}</p>}
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = React.useState<Tab>('dashboard')
  const [postingKey, setPostingKey] = React.useState('')

  /* Archive */
  const [articles, setArticles] = React.useState<ManagedArticle[]>([])
  const [loadingList, setLoadingList] = React.useState(true)
  const [manageError, setManageError] = React.useState<string | null>(null)
  const [deletingSlug, setDeletingSlug] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('All')

  /* Editor */
  const [editingSlug, setEditingSlug] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState('')
  const [category, setCategory] = React.useState<string>(CATEGORIES[0])
  const [dek, setDek] = React.useState('')
  const [body, setBody] = React.useState('')
  const [authorName, setAuthorName] = React.useState('')
  const [imageUrl, setImageUrl] = React.useState('')
  const [imageAlt, setImageAlt] = React.useState('')
  const [showPreview, setShowPreview] = React.useState(false)
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = React.useState<string | null>(null)

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
    loadArticles()
  }, [loadArticles])

  /* ── Dashboard stats ─────────────────────────────────────── */
  const stats = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of articles) counts.set(a.category, (counts.get(a.category) ?? 0) + 1)
    const latest = articles[0]
    return {
      total: articles.length,
      sections: counts.size,
      counts,
      latest,
      minutes: articles.reduce((sum, a) => sum + a.readMinutes, 0),
    }
  }, [articles])

  const filtered = React.useMemo(() => {
    const needle = filter.trim().toLowerCase()
    return articles.filter((a) => {
      if (categoryFilter !== 'All' && a.category !== categoryFilter) return false
      if (!needle) return true
      return `${a.title}\n${a.dek}\n${a.authorName}`.toLowerCase().includes(needle)
    })
  }, [articles, filter, categoryFilter])

  const clearForm = () => {
    setEditingSlug(null)
    setTitle(''); setDek(''); setBody(''); setImageUrl(''); setImageAlt(''); setAuthorName('')
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
    setImageAlt(article.imageAlt ?? '')
    setStatus('idle'); setError(null); setPublishedUrl(null)
    setTab('write')
  }

  const startNew = () => {
    clearForm()
    setTab('write')
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!postingKey) {
      setError('Enter the posting key at the top of the page first.')
      return
    }
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
        body: JSON.stringify({ title, category, dek, body, authorName, imageUrl, imageAlt }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong.')
        setStatus('idle')
        return
      }
      setPublishedUrl(json.url)
      setStatus('done')
      loadArticles()
    } catch {
      setError('Could not reach the server.')
      setStatus('idle')
    }
  }

  const onDelete = async (slug: string) => {
    if (!postingKey) {
      setManageError('Enter the posting key at the top of the page first — deleting requires it.')
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

  const tabButton = (value: Tab, label: string, Icon: typeof LayoutDashboard) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      className={cn(
        'focus-ring inline-flex items-center gap-2 rounded-full px-5 py-2 font-sans text-xs font-bold uppercase tracking-kicker transition-colors',
        tab === value ? 'bg-gold text-navy-900' : 'text-ink-muted hover:bg-surface-2 hover:text-ink-strong'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        {/* ── Desk header ─────────────────────────────────────── */}
        <header className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-gold/10">
            <Feather className="h-5 w-5 text-gold" strokeWidth={1.5} />
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink-strong md:text-4xl">
            The Posting Desk
          </h1>

          {/* One key for the whole desk — every write action uses it. */}
          <div className="relative mt-5 w-full max-w-sm">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <Input
              type="password"
              value={postingKey}
              onChange={(e) => setPostingKey(e.target.value)}
              placeholder="Posting key (needed to publish or delete)"
              className="pl-11"
              autoComplete="current-password"
              aria-label="Posting key"
            />
          </div>

          <div className="mt-6 inline-flex gap-1 rounded-full border border-hairline p-1">
            {tabButton('dashboard', 'Dashboard', LayoutDashboard)}
            {tabButton('write', editingSlug ? 'Editing' : 'Write', PenLine)}
            {tabButton('manage', 'Manage', Layers)}
          </div>
        </header>

        {/* ── DASHBOARD ───────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="mt-10">
            {loadingList ? (
              <p className="flex items-center justify-center gap-2 py-16 font-sans text-sm text-ink-muted">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading the desk…
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatTile
                    label="Published articles"
                    value={String(stats.total)}
                    hint={stats.latest ? `Latest ${ago(stats.latest.publishedAt)}` : 'Nothing published yet'}
                  />
                  <StatTile
                    label="Sections in use"
                    value={`${stats.sections} / ${CATEGORIES.length}`}
                    hint="Every section filled keeps the desk balanced"
                  />
                  <StatTile
                    label="Reading on offer"
                    value={`${stats.minutes} min`}
                    hint="Combined length of the archive"
                  />
                </div>

                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {/* Sections breakdown */}
                  <div className="card !rounded-2xl p-6">
                    <p className="kicker text-gold">The sections</p>
                    <ul className="mt-4 space-y-3">
                      {CATEGORIES.map((c) => {
                        const count = stats.counts.get(c) ?? 0
                        const share = stats.total ? Math.round((count / stats.total) * 100) : 0
                        return (
                          <li key={c}>
                            <div className="flex items-baseline justify-between gap-4">
                              <span className="font-sans text-sm text-ink">{c}</span>
                              <span className="tabular font-sans text-xs text-ink-subtle">{count}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                              <div
                                className="h-full rounded-full bg-gold/70"
                                style={{ width: `${share}%` }}
                              />
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {/* Latest pieces */}
                  <div className="card !rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <p className="kicker text-gold">Latest from the desk</p>
                      <Button size="sm" onClick={startNew}>
                        <PenLine />
                        New article
                      </Button>
                    </div>
                    {articles.length === 0 ? (
                      <p className="py-10 text-center font-serif text-base text-ink-muted">
                        Nothing published yet — write the first piece.
                      </p>
                    ) : (
                      <ul className="mt-3 divide-y divide-hairline">
                        {articles.slice(0, 5).map((a) => (
                          <li key={a.slug} className="flex items-center justify-between gap-3 py-3">
                            <div className="min-w-0">
                              <p className="truncate font-display text-base font-semibold text-ink">
                                {a.title}
                              </p>
                              <p className="mt-0.5 font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
                                {a.category} · {ago(a.publishedAt)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => startEdit(a)}
                              className="focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-full border border-hairline text-ink-muted transition-colors hover:border-gold/50 hover:text-gold"
                              aria-label={`Edit ${a.title}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── WRITE ───────────────────────────────────────────── */}
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
                {/* Linking out of a teaching — to another teaching, to a
                    section — is most of what internal linking is on a site
                    this size, so the syntax for it is spelled out here. */}
                <div className="mt-2 space-y-1 font-sans text-xs leading-relaxed text-ink-subtle">
                  <p>
                    Blank line = new paragraph · <code className="text-gold">## </code> subheading ·
                    <code className="text-gold"> &gt; </code> quoted Scripture (close with
                    <code className="text-gold"> — Isaiah 40:3</code>) ·
                    <code className="text-gold"> - </code> or <code className="text-gold">1. </code> for a list
                  </p>
                  <p>
                    Link a phrase with <code className="text-gold">[the rapture](/articles/rapture-or-second-coming)</code> ·
                    emphasise with <code className="text-gold">*italic*</code> or <code className="text-gold">**bold**</code>
                  </p>
                </div>
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
                  {body && <ArticleProse body={body} />}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="a-image" className={fieldLabel}>Image URL (optional)</label>
                  <Input
                    id="a-image" value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://… or /images/…" className="mt-2"
                  />
                </div>
                <div>
                  <label htmlFor="a-image-alt" className={fieldLabel}>What the image shows</label>
                  <Input
                    id="a-image-alt" value={imageAlt}
                    required={Boolean(imageUrl)}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="A rugged wooden cross against a golden sky"
                    className="mt-2"
                  />
                  {/* Describing the photograph is what a screen reader
                      reads out and what image search indexes. Repeating
                      the headline here tells neither of them anything. */}
                  <p className="mt-2 font-sans text-xs text-ink-subtle">
                    Describe the picture itself — not the headline again.
                  </p>
                </div>
              </div>

              <div className="border-t border-hairline pt-6">
                {error && (
                  <p role="alert" className="mb-4 font-sans text-sm text-status-danger">{error}</p>
                )}
                <Button type="submit" size="lg" disabled={status === 'saving'} className="w-full sm:w-auto">
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

        {/* ── MANAGE ──────────────────────────────────────────── */}
        {tab === 'manage' && (
          <div className="card mt-10 !rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter by title, summary, or author…"
                  className="pl-11"
                  aria-label="Filter articles"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="focus-ring h-11 rounded-full border border-hairline-strong bg-surface px-5 font-sans text-sm text-ink transition-colors focus:border-gold/60"
                aria-label="Filter by section"
              >
                <option className="bg-panel text-ink">All</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-panel text-ink">{c}</option>
                ))}
              </select>
            </div>

            {manageError && (
              <p role="alert" className="mt-4 font-sans text-sm text-status-danger">{manageError}</p>
            )}

            <div className="mt-6 border-t border-hairline">
              {loadingList ? (
                <p className="flex items-center gap-2 py-8 font-sans text-sm text-ink-muted">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading the archive…
                </p>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center font-serif text-base text-ink-muted">
                  {articles.length === 0
                    ? 'Nothing published from the desk yet — write the first piece.'
                    : 'No articles match that filter.'}
                </p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {filtered.map((article) => (
                    <li key={article.slug} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold leading-snug text-ink-strong">
                          {article.title}
                        </p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-2 font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
                          <Badge variant="outline" size="sm">{article.category}</Badge>
                          {ago(article.publishedAt)}
                          <span>· {article.readMinutes} min</span>
                          <span>· {article.authorName}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-hairline px-4 font-sans text-xs font-semibold text-ink-muted transition-colors hover:border-gold/50 hover:text-gold"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
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
