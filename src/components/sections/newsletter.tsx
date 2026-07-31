'use client'

import * as React from 'react'
import { Check, Sunrise } from 'lucide-react'
import { siteInfo } from '@/lib/content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/motion'

/**
 * The Morning Portion — the Herald's daily bread by email. One field,
 * one promise, no noise.
 */
export function Newsletter() {
  const [email, setEmail] = React.useState('')
  const [subscribed, setSubscribed] = React.useState(false)

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
  }

  return (
    <section id="newsletter" aria-label="Newsletter" className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 md:pb-28 lg:px-8">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-gold/25 bg-panel">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 90% at 85% 10%, rgba(212,160,23,0.16) 0%, transparent 60%), radial-gradient(50% 80% at 8% 100%, rgba(31,69,133,0.35) 0%, transparent 65%)',
            }}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'var(--grain-image)' }} />

          <div className="relative grid grid-cols-1 gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:items-center lg:p-16">
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-gold/10">
                <Sunrise className="h-5 w-5 text-gold-light" strokeWidth={1.5} />
              </span>
              <p className="kicker mt-6 text-gold">The Morning Portion</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink-strong md:text-4xl">
                A verse, a teaching, and a prayer — on your doorstep before sunrise.
              </h2>
              <p className="mt-4 max-w-md font-serif text-base leading-relaxed text-ink-muted">
                Join {siteInfo.readers} readers in {siteInfo.nations} nations who open the
                day with the Word. Weekday mornings, two minutes, no noise — and you can
                leave whenever you wish.
              </p>
            </div>

            <div>
              {subscribed ? (
                <div className="rounded-2xl border border-status-success/30 bg-status-success/10 p-8 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-status-success/15">
                    <Check className="h-6 w-6 text-status-success" />
                  </span>
                  <p className="mt-4 font-display text-xl font-semibold text-ink-strong">
                    Welcome to the table.
                  </p>
                  <p className="mt-2 font-serif text-sm text-ink-muted">
                    Your first portion arrives tomorrow before sunrise. Check your inbox
                    to confirm your address.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="lg:pl-8">
                  <label htmlFor="newsletter-email" className="kicker block text-ink-subtle">
                    Your email address
                  </label>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="newsletter-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="lg" className="sm:shrink-0">
                      Receive the portion
                    </Button>
                  </div>
                  <p className="mt-4 font-sans text-xs leading-relaxed text-ink-subtle">
                    Free, always. We will never share your address — “freely you have
                    received; freely give.”
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
