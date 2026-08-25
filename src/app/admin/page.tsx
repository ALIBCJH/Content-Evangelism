'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Eye, EyeOff, Feather, LoaderCircle, Pencil, UserRound, X } from 'lucide-react'
import { CATEGORIES } from '@/lib/content'
import { postedWhen } from '@/lib/when'
import { ArticleProse } from '@/components/article-prose'
import { Button } from '@/components/ui/button'
import { BodyEditor } from '@/components/admin/body-editor'
import { clearDraft, readDraft, useDraftAutosave, worthKeeping, type Draft } from '@/lib/draft'
import { Input } from '@/components/ui/input'
import { WriterProfile, type MeWriter } from '@/components/admin/writer-profile'

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

const fieldLabel = 'kicker block text-ink-subtle'
const textareaClass =
  'focus-ring mt-2 w-full rounded-2xl border border-hairline-strong bg-surface px-5 py-4 font-serif text-base leading-relaxed text-ink placeholder:text-ink-subtle transition-colors focus:border-gold/60'

/**
 * When something happened, as the desk reads it.
 *
 * This said "3 months ago" indefinitely, which is a number a person has
 * to convert back into a date every time they want to know which
 * Tuesday. Recency is the useful answer for a day and the useless one
 * after that, so it stops at a day. The desk renders in the browser, so
 * the clock here is the reader's own.
 */
function ago(iso: string): string {
  return postedWhen(iso, Date.now())
}

/** One of the three places a writer's piece can be. */
function StandingTile({
  label,
  n,
  note,
  urgent,
}: {
  label: string
  n: number
  note: string
  urgent: boolean
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">
      <p
        className={`tabular font-display text-[1.75rem] leading-none ${
          urgent ? 'text-gold' : 'text-ink-strong'
        }`}
      >
        {n}
      </p>
      <p className="mt-2 font-sans text-sm font-semibold text-ink-strong">{label}</p>
      <p className="mt-1 font-sans text-xs leading-relaxed text-ink-subtle">{note}</p>
    </div>
  )
}

/** Words in a held draft, for the offer to say how much is at stake. */
function wordsIn(body: string): number {
  return body.trim() ? body.trim().split(/\s+/).filter(Boolean).length : 0
}

export default function AdminPage() {
  /* Archive */
  const [articles, setArticles] = React.useState<ManagedArticle[]>([])
  const [loadingList, setLoadingList] = React.useState(true)
  const [listError, setListError] = React.useState<string | null>(null)
  /* Who is at the desk. Null for a session bought with one of the
     ministry's own env keys, which belongs to the ministry rather than to
     a person — the byline falls back to the editorial desk, as it always
     did, and there is no page to offer. */
  const [me, setMe] = React.useState<MeWriter | null>(null)

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
  /* Off by default. The editor is where the work is done; the preview is
     for the moment before sending, when the question stops being "what am
     I writing" and becomes "what will they read". */
  const [previewing, setPreviewing] = React.useState(false)

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
  }
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = React.useState<string | null>(null)

  const loadMe = React.useCallback(async () => {
    try {
      const res = await fetch('/api/desk/me', { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      setMe(json.writer ?? null)
    } catch {
      /* Not knowing who you are costs the byline and the profile panel,
         not the ability to write. */
    }
  }, [])

  const loadArticles = React.useCallback(async () => {
    setLoadingList(true)
    setListError(null)
    try {
      /* mine=1, and narrowed on the server. A page that received
         everybody's drafts and filtered them in the browser would have
         been sent the reasons a reviewer sent somebody else's work back,
         which is between the reviewer and the person who wrote it. */
      const res = await fetch('/api/articles?mine=1', { cache: 'no-store' })
      const json = await res.json()
      setArticles(json.articles ?? [])
    } catch {
      setListError('Could not load what you have sent.')
    } finally {
      setLoadingList(false)
    }
  }, [])

  React.useEffect(() => {
    void loadMe()
  }, [loadMe])

  React.useEffect(() => {
    loadArticles()
  }, [loadArticles])

  /**
   * The writer's own pieces, sorted into the three states that matter to
   * somebody who has sent work in.
   *
   * The desk used to show one flat list of everything on the site with a
   * Delete beside each row, which answered a question a writer never asks
   * and buried the one they always do: what happened to the thing I sent?
   * Sent back is first because it is the only one of the three that is
   * waiting on them.
   */
  const mine = React.useMemo(() => {
    const sentBackToMe = articles.filter((a) => a.status === 'pending' && a.review)
    const inTheQueue = articles.filter((a) => a.status === 'pending' && !a.review)
    const live = articles.filter((a) => a.status !== 'pending')
    return { sentBackToMe, inTheQueue, live }
  }, [articles])

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
  }


  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setStatus('saving')
    try {
      const endpoint = editingSlug ? `/api/articles/${editingSlug}` : '/api/articles'
      const res = await fetch(endpoint, {
        method: editingSlug ? 'PUT' : 'POST',
        /* No Authorization header. The browser carries the session set at
           the door, and the server turns it back into this desk's key. */
        headers: { 'Content-Type': 'application/json' },
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

  /* No masthead and no footer. The reader's navigation was on this page —
     Articles, Prophecy Archive, Teachings, About, and a theme switch —
     which is the site's chrome on a page that is not the site: every one
     of those links takes a writer out of the desk mid-piece, and the
     draft they were holding is only saved because something else saves
     it. What is left above the writing is the way out of the desk. */
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        {/* ── Desk header ─────────────────────────────────────── */}
        <header className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-gold/10">
            <Feather className="h-5 w-5 text-gold" strokeWidth={1.5} />
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink-strong md:text-4xl">
            The Posting Desk
          </h1>
          <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-ink-muted">
            {me ? `${me.name}'s desk. ` : ''}Nothing sent from here reaches a reader until the
            review desk approves it — so write freely, and send it when it is ready.
          </p>

          <p className="mt-5 font-sans text-sm text-ink-muted">
            <Link href="/admin/questions" className="transition-colors hover:text-gold">
              Answer questions from readers →
            </Link>
          </p>
        </header>

        {me && (
          <div className="mt-10">
            <WriterProfile writer={me} onSaved={loadMe} />
          </div>
        )}

        {/* ── What you have sent, and where it stands ─────────── */}
        <section className="mt-10">
          {listError && (
            <p role="alert" className="mb-4 font-sans text-sm text-status-danger">
              {listError}
            </p>
          )}

          {loadingList ? (
            <p className="flex items-center gap-2 font-sans text-sm text-ink-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Looking up what you have sent…
            </p>
          ) : (
            <>
              {/* Sent back is the only one of the three states waiting on
                  the writer, so it is the only one shown open, with the
                  reviewer's reason and a way straight back into the piece. */}
              {mine.sentBackToMe.length > 0 && (
                <div className="rounded-2xl border border-gold/40 bg-chip-gold/30 p-5 sm:p-6">
                  <p className="kicker text-gold-ink">
                    Sent back to you
                    <span className="tabular ml-2">{mine.sentBackToMe.length}</span>
                  </p>
                  <ul className="mt-4 flex flex-col gap-4">
                    {mine.sentBackToMe.map((article) => (
                      <li
                        key={article.slug}
                        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-display text-base font-semibold text-ink-strong">
                            {article.title}
                          </p>
                          <p className="mt-1 font-sans text-sm leading-relaxed text-ink-muted">
                            {article.review?.note}
                          </p>
                          <p className="mt-1 font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
                            {article.review ? ago(article.review.at) : ago(article.publishedAt)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => {
                            startEdit(article)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          <Pencil />
                          Rework it
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div
                className={`grid gap-3 sm:grid-cols-3 ${
                  mine.sentBackToMe.length > 0 ? 'mt-4' : ''
                }`}
              >
                <StandingTile
                  label="Waiting for review"
                  n={mine.inTheQueue.length}
                  note="Sent in and not yet read."
                  urgent={false}
                />
                <StandingTile
                  label="Sent back to you"
                  n={mine.sentBackToMe.length}
                  note="Needs reworking before it can go on."
                  urgent={mine.sentBackToMe.length > 0}
                />
                <StandingTile
                  label="On the site"
                  n={mine.live.length}
                  note="Approved and readable."
                  urgent={false}
                />
              </div>

              {mine.inTheQueue.length > 0 && (
                <ul className="mt-4 divide-y divide-hairline rounded-2xl border border-hairline">
                  {mine.inTheQueue.map((article) => (
                    <li
                      key={article.slug}
                      className="flex flex-wrap items-center gap-3 px-5 py-3"
                    >
                      <span className="min-w-0 flex-1 font-sans text-sm text-ink-strong">
                        {article.title}
                      </span>
                      <span className="font-sans text-[0.6875rem] uppercase tracking-kicker text-ink-subtle">
                        {ago(article.publishedAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          startEdit(article)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="focus-ring inline-flex items-center gap-1.5 rounded-chip border border-hairline px-3 py-1.5 font-sans text-xs font-semibold text-ink-muted transition-colors hover:border-gold/50 hover:text-gold"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {/* ── The writing ─────────────────────────────────────── */}
        {status === 'done' ? (
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
                  <span className={fieldLabel}>Byline</span>
                  {/* Shown rather than asked for. A byline is who wrote
                      the piece, and a box somebody types is a box somebody
                      can type anybody's name into — the server stamps a
                      signed-in writer's own name whatever this page
                      sends. It also ends the quieter problem: "Simon
                      Juma", "simon juma" and "SIMON JUMA" were three
                      authors to the archive, none of whom had a page. */}
                  {me ? (
                    <p className="mt-2 flex h-11 items-center gap-2 rounded-full border border-hairline bg-surface px-5 font-sans text-sm text-ink">
                      <UserRound aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                      {me.name}
                    </p>
                  ) : (
                    <Input
                      id="a-author" value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="The Editorial Desk" className="mt-2"
                      aria-label="Byline"
                    />
                  )}
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

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className={fieldLabel}>The teaching</span>
                  {/* The desk had ArticleProse and the two eye icons
                      imported and never used — a preview somebody meant to
                      build. On a page that is now only for writing, seeing
                      the piece as a reader will get it is the one thing
                      worth having beside the editor. */}
                  <button
                    type="button"
                    onClick={() => setPreviewing((was) => !was)}
                    disabled={!body.trim()}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-chip border border-hairline px-3 py-1.5 font-sans text-xs font-semibold text-ink-muted transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40"
                  >
                    {previewing ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Back to writing
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        See it as a reader will
                      </>
                    )}
                  </button>
                </div>

                {previewing ? (
                  <div className="rounded-2xl border border-hairline-strong bg-surface px-5 py-6 sm:px-8">
                    <p className="kicker text-gold">{category}</p>
                    <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink-strong sm:text-3xl">
                      {title.trim() || 'Untitled'}
                    </h2>
                    {dek.trim() && (
                      <p className="mt-3 font-serif text-lg leading-relaxed text-ink-muted">{dek}</p>
                    )}
                    <div className="mt-6 border-t border-hairline pt-6">
                      <ArticleProse body={body} />
                    </div>
                  </div>
                ) : (
                  <BodyEditor value={body} onChange={setBody} />
                )}
              </div>

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
          )}

    </main>
  )
}
