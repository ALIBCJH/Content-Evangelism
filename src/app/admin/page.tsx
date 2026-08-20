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
import { BodyEditor } from '@/components/admin/body-editor'
import { clearDraft, readDraft, useDraftAutosave, worthKeeping, type Draft } from '@/lib/draft'
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
  tags?: string[]
  status?: 'pending' | 'published'
  review?: { note: string; at: string }
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

/** Words in a held draft, for the offer to say how much is at stake. */
function wordsIn(body: string): number {
  return body.trim() ? body.trim().split(/\s+/).filter(Boolean).length : 0
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
  const [tags, setTags] = React.useState('')
  /* A draft found in this browser from a previous sitting. Offered rather
     than restored: the desk may have published since, and having the form
     fill itself with an old piece would be worse than losing it. */
  const [held, setHeld] = React.useState<Draft | null>(null)

  React.useEffect(() => {
    const draft = readDraft()
    if (draft && worthKeeping(draft)) setHeld(draft)
  }, [])

  /* "Edit first" on the review desk sends the reviewer here with the
     piece named in the address. It opens once the list has arrived, and
     only once — a writer who then navigates away is not dragged back. */
  const opened = React.useRef(false)
  React.useEffect(() => {
    if (opened.current || articles.length === 0) return
    const wanted = new URLSearchParams(window.location.search).get('edit')
    if (!wanted) return
    const article = articles.find((candidate) => candidate.slug === wanted)
    if (!article) return
    opened.current = true
    startEdit(article)
  })

  const savedAt = useDraftAutosave({
    editingSlug,
    title,
    category,
    dek,
    body,
    authorName,
    imageUrl,
    imageAlt,
    tags,
  })

  /* The reviewer's reason, on the piece currently open in the form. */
  const sentBack = React.useMemo(
    () => (editingSlug ? articles.find((a) => a.slug === editingSlug)?.review ?? null : null),
    [articles, editingSlug]
  )

  const restore = (draft: Draft) => {
    setEditingSlug(draft.editingSlug)
    setTitle(draft.title)
    setCategory(draft.category)
    setDek(draft.dek)
    setBody(draft.body)
    setAuthorName(draft.authorName)
    setImageUrl(draft.imageUrl)
    setImageAlt(draft.imageAlt)
    setTags(draft.tags)
    setHeld(null)
    setTab('write')
  }
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
    clearDraft()
    setHeld(null)
    setEditingSlug(null)
    setTitle(''); setDek(''); setBody(''); setImageUrl(''); setImageAlt(''); setAuthorName(''); setTags('')
    setPublishedUrl(null); setStatus('idle'); setError(null)
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
    setTags((article.tags ?? []).join(', '))
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
        body: JSON.stringify({ title, category, dek, body, authorName, imageUrl, imageAlt, tags }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong.')
        setStatus('idle')
        return
      }
      setPublishedUrl(json.url)
      setStatus('done')
      /* Let go of the held draft only now: a piece that failed to publish
         is a piece the desk still needs. */
      clearDraft()
      setHeld(null)
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
        'focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 font-sans text-xs font-bold uppercase tracking-kicker transition-colors sm:gap-2 sm:px-5',
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

          {/* max-w-full and a scroll rather than three fixed tabs: at
              390px the third one was off the edge of the screen. */}
          <div className="mt-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-hairline p-1">
            {tabButton('dashboard', 'Dashboard', LayoutDashboard)}
            {tabButton('write', editingSlug ? 'Editing' : 'Write', PenLine)}
            {tabButton('manage', 'Manage', Layers)}
          </div>

          {/* The other two rooms at the desk. They were reachable only by
              typing the URL, and a queue of readers' questions that nobody
              can find is a queue nobody works. */}
          <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-sans text-sm text-ink-muted">
            <Link href="/admin/questions" className="transition-colors hover:text-gold">
              Questions from readers →
            </Link>
            <Link href="/admin/insight" className="transition-colors hover:text-gold">
              How the site is read →
            </Link>
          </p>
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
                {editingSlug ? 'Saved.' : 'Sent for review.'}
              </p>
              {/* A new piece is not on the site and must not be described
                  as though it were. An edit to something already live is,
                  which is why the address is only offered for that. */}
              <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-ink-muted">
                {editingSlug
                  ? 'The change is in.'
                  : 'It is in the queue. A senior reviewer reads it, and it goes on the site when they approve it.'}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {editingSlug && publishedUrl && (
                  <Link href={publishedUrl} className="inline-flex">
                    <span className="focus-ring inline-flex h-10 items-center gap-2 rounded-full bg-gold px-6 font-sans text-sm font-semibold text-navy-900 transition-all hover:bg-gold-light">
                      Read it now
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                )}
                <Button variant="outline" onClick={clearForm}>Write another</Button>
                <Link
                  href="/admin/review"
                  className="focus-ring font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
                >
                  The review desk →
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="card mt-10 space-y-6 !rounded-2xl p-6 sm:p-8">
              {sentBack && (
                <div className="rounded-xl border border-gold/40 bg-chip-gold/40 px-4 py-3">
                  <p className="font-sans text-xs font-bold uppercase tracking-kicker text-gold-ink">
                    Sent back by the review desk
                  </p>
                  <p className="mt-1.5 font-sans text-sm text-ink-strong">{sentBack.note}</p>
                </div>
              )}

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

              {/* Something typed here and never published. Offered rather
                  than restored, because the desk may have published it
                  since from another machine — filling the form with an old
                  copy would be worse than losing it. */}
              {held && (
                <div className="rounded-2xl border border-gold/40 bg-chip-gold/40 px-5 py-4">
                  <p className="font-sans text-sm text-ink-strong">
                    An unpublished draft is held in this browser
                    {held.title.trim() ? (
                      <>
                        {' '}
                        — <span className="font-semibold">{held.title.trim()}</span>
                      </>
                    ) : null}
                    , {wordsIn(held.body)} words.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => restore(held)}
                      className="focus-ring rounded-chip bg-plate px-4 py-2 font-sans text-xs font-bold uppercase tracking-kicker text-plate-pale transition-colors hover:bg-plate-deep"
                    >
                      Bring it back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearDraft()
                        setHeld(null)
                      }}
                      className="focus-ring font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
                    >
                      Discard it
                    </button>
                  </div>
                </div>
              )}

              <BodyEditor value={body} onChange={setBody} />

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

              <div>
                <label htmlFor="a-tags" className={fieldLabel}>Tags (optional)</label>
                <Input
                  id="a-tags" value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="repentance, holiness, rapture"
                  className="mt-2"
                />
                {/* The category says which section a piece belongs to;
                    these say what it is about, and are what the public
                    API filters on. Tidied on the way in — case, spacing
                    and punctuation all come out the same. */}
                <p className="mt-2 font-sans text-xs text-ink-subtle">
                  Separate with commas. Up to eight; a reader filtering the archive, and any
                  agent reading the API, finds the piece by these.
                </p>
              </div>

              <div className="border-t border-hairline pt-6">
                {error && (
                  <p role="alert" className="mb-4 font-sans text-sm text-status-danger">{error}</p>
                )}
                {/* Said out loud, because a writer who cannot see that it
                    saved does not believe that it saved. */}
                {savedAt && (
                  <p className="mb-3 font-sans text-xs text-ink-subtle">
                    Draft kept in this browser · saved{' '}
                    {new Date(savedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
                <Button type="submit" size="lg" disabled={status === 'saving'} className="w-full sm:w-auto">
                  {status === 'saving' ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      {editingSlug ? 'Saving…' : 'Sending…'}
                    </>
                  ) : editingSlug ? 'Save changes' : 'Send for review'}
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
                          {/* Whether a reader can see it, said plainly:
                              the writer's list was identical for a piece
                              on the site and a piece nobody has approved. */}
                          {article.status === 'pending' ? (
                            <span className="rounded-chip bg-chip-gold px-2 py-0.5 text-gold-ink">
                              {article.review ? 'Sent back' : 'Waiting for review'}
                            </span>
                          ) : (
                            <span className="text-status-success">On the site</span>
                          )}
                          {ago(article.publishedAt)}
                          <span>· {article.readMinutes} min</span>
                          <span>· {article.authorName}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {article.status === 'pending' ? (
                          <Link
                            href="/admin/review"
                            className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-hairline px-4 font-sans text-xs font-semibold text-ink-muted transition-colors hover:border-gold/50 hover:text-gold"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            In the queue
                          </Link>
                        ) : (
                          <Link
                            href={`/articles/${article.slug}`}
                            className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-hairline px-4 font-sans text-xs font-semibold text-ink-muted transition-colors hover:border-gold/50 hover:text-gold"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            View
                          </Link>
                        )}
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
