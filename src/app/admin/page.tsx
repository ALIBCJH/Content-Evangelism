'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Feather, LoaderCircle } from 'lucide-react'
import { CATEGORIES } from '@/lib/content'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const fieldLabel = 'kicker block text-ink-subtle'
const textareaClass =
  'focus-ring mt-2 w-full rounded-2xl border border-hairline-strong bg-surface px-5 py-4 font-serif text-base leading-relaxed text-ink placeholder:text-ink-subtle transition-colors focus:border-gold/60'

export default function AdminPage() {
  const [title, setTitle] = React.useState('')
  const [category, setCategory] = React.useState<string>(CATEGORIES[0])
  const [dek, setDek] = React.useState('')
  const [body, setBody] = React.useState('')
  const [authorName, setAuthorName] = React.useState('')
  const [imageUrl, setImageUrl] = React.useState('')
  const [postingKey, setPostingKey] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = React.useState<string | null>(null)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setStatus('saving')
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
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

  const reset = () => {
    setTitle(''); setDek(''); setBody(''); setImageUrl('')
    setPublishedUrl(null); setStatus('idle'); setError(null)
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
          <p className="mx-auto mt-3 max-w-md font-serif text-base text-ink-muted">
            Publish a new article to the site. Blank line starts a new paragraph;
            begin a line with <code className="font-sans text-sm text-gold">## </code>
            for a subheading.
          </p>
        </header>

        {status === 'done' ? (
          <div className="card mt-10 !rounded-2xl p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-status-success/15">
              <Check className="h-6 w-6 text-status-success" />
            </span>
            <p className="mt-4 font-display text-2xl font-semibold text-ink-strong">
              Published.
            </p>
            <p className="mt-2 font-serif text-sm text-ink-muted">
              The article is live and listed on the Articles page.
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
              <Button variant="outline" onClick={reset}>Write another</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card mt-10 space-y-6 !rounded-2xl p-6 sm:p-8">
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
              <label htmlFor="a-body" className={fieldLabel}>Article body</label>
              <textarea
                id="a-body" required minLength={50} rows={14} value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={'The opening paragraph…\n\n## A Subheading\n\nThe next paragraph…'}
                className={textareaClass}
              />
            </div>

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
                    Publishing…
                  </>
                ) : (
                  'Publish the article'
                )}
              </Button>
            </div>
          </form>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
