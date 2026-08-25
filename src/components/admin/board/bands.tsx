'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { DayTotals } from '@/lib/insight-shape'
import { enoughToRate, type DeskNeeds, type PartRow, type WindowSummary } from '@/lib/desk-overview'
import { CLICK_WORDS, change, count, duration, percent } from './format'

/* ── Band 1 · What needs you now ──────────────────────────────────── */

/**
 * The four decisions, before any measurement.
 *
 * This band is first and stays first. A desk that opens on a chart is a
 * dashboard, and the queue underneath it is the thing that actually keeps
 * a teaching from reaching a reader.
 */
export function NeedsBand({ needs }: { needs: DeskNeeds }) {
  const items: { label: string; value: number; href?: string; urgent: boolean; note: string }[] = [
    {
      label: 'Waiting for review',
      value: needs.waiting,
      urgent: needs.waiting > 0,
      note: 'Written and submitted, nobody has read it yet.',
    },
    {
      label: 'Live but unverified',
      value: needs.unverified,
      urgent: needs.unverified > 0,
      note: 'On the site, never checked against the ministry’s own teaching.',
    },
    {
      label: 'Sent back',
      value: needs.sentBack,
      urgent: false,
      note: 'Returned with a reason, not yet reworked.',
    },
    {
      label: 'Readers waiting',
      value: needs.unanswered,
      href: '/admin/questions',
      urgent: needs.unanswered > 0,
      note: 'Questions sent in and not yet answered.',
    },
  ]

  return (
    <section aria-labelledby="band-needs">
      <h2 id="band-needs" className="font-display text-xl text-ink-strong">
        What needs you
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const body = (
            <>
              <span
                className={`desk-figure block text-[2rem] ${
                  item.urgent ? 'text-gold' : 'text-ink-subtle'
                }`}
              >
                {count(item.value)}
              </span>
              <span className="mt-2 block font-sans text-sm font-semibold text-ink-strong">
                {item.label}
              </span>
              <span className="mt-1 block font-sans text-xs leading-relaxed text-ink-subtle">
                {item.note}
              </span>
            </>
          )
          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="focus-ring block h-full desk-card px-5 py-4 transition-colors hover:border-gold/60"
                >
                  {body}
                </Link>
              ) : (
                <div className="h-full desk-card px-5 py-4">
                  {body}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ── Band 2 · The stretch ─────────────────────────────────────────── */

function Change({ rate }: { rate: number | null }) {
  const { text, direction } = change(rate)
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus
  const tone =
    direction === 'up'
      ? 'text-status-success'
      : direction === 'down'
        ? 'text-status-danger'
        : 'text-ink-subtle'
  return (
    <span className={`inline-flex items-center gap-1 font-sans text-xs font-semibold ${tone}`}>
      <Icon aria-hidden className="h-3.5 w-3.5" />
      {text}
    </span>
  )
}

/**
 * The shape of the stretch, drawn by hand.
 *
 * An SVG polyline over the day totals rather than a charting library: it
 * is thirty numbers, the page already ships more JavaScript than it needs
 * to, and a dependency that renders one line is a dependency to keep
 * updated for ever.
 */
function Sparkline({ series }: { series: DayTotals[] }) {
  const values = series.map((day) => day.views)
  const highest = Math.max(1, ...values)
  const width = 100
  const height = 28

  const at = (index: number) =>
    values.length > 1 ? (index / (values.length - 1)) * width : width / 2
  /* One unit of headroom at each end, so the highest day is not clipped
     by the stroke's own width and the lowest is not sitting on the axis. */
  const upto = (value: number) => height - 1 - (value / highest) * (height - 2)

  const points = values.map((value, index) => `${at(index).toFixed(2)},${upto(value).toFixed(2)}`).join(' ')
  /* The same line closed down to the baseline. A bare stroke across a
     card reads as a stray mark; the fill under it is what makes it a
     chart, and it costs one path. */
  const area = `${points} ${width},${height} 0,${height}`
  const lastValue = values[values.length - 1] ?? 0

  return (
    /* The chart is drawn stretched — `preserveAspectRatio="none"`, so the
       line spans the card whatever width it is given — and the marker for
       the last day is therefore laid over it in HTML rather than drawn
       inside it. A circle in a stretched viewBox is an ellipse, and a
       teaching-desk chart with a squashed dot on the end of it is exactly
       the kind of detail that makes a board look unfinished. */
    <div className="relative mt-3 h-8 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full text-gold"
        role="img"
        aria-label={`Visits over the last ${series.length} days, highest ${count(highest)} in a day`}
      >
        {/* `currentColor` at an opacity, rather than a fill utility: the
            fill is the same gold as the line and must not drift from it. */}
        <polygon points={area} fill="currentColor" opacity="0.14" />
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Where the line ended, which is what a reader of this card is
          actually asking. Always the right-hand edge, so only the height
          has to be worked out. */}
      <span
        aria-hidden
        className="absolute right-0 h-[7px] w-[7px] -translate-y-1/2 translate-x-1/2 rounded-full bg-gold ring-2 ring-card"
        style={{ top: `${(upto(lastValue) / height) * 100}%` }}
      />
    </div>
  )
}

export function StretchBand({
  summary,
  series,
  days,
}: {
  summary: WindowSummary
  series: DayTotals[]
  days: number
}) {
  return (
    <section aria-labelledby="band-stretch">
      <h2 id="band-stretch" className="font-display text-xl text-ink-strong">
        The last {days} days
      </h2>
      {/* Said once, plainly, and not softened. The site stores nothing per
          reader, so a count of people is a number it cannot honestly
          give — and a board that implies otherwise is one the ministry
          would be right to stop believing. */}
      <p className="mt-2 max-w-prose font-sans text-sm leading-relaxed text-ink-muted">
        Visits, not visitors. Nothing is stored about any reader, so one person opening a teaching
        three times and three people opening it once are the same number here.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="desk-card px-5 py-4">
          <span className="kicker block text-ink-subtle">Visits</span>
          <span className="desk-figure mt-2 block text-[2rem]">
            {count(summary.visits)}
          </span>
          <span className="mt-2 block">
            <Change rate={summary.change.visits} />
            <span className="ml-1.5 font-sans text-xs text-ink-subtle">on the {days} before</span>
          </span>
          <Sparkline series={series} />
        </div>

        <div className="desk-card px-5 py-4">
          <span className="kicker block text-ink-subtle">Time spent reading</span>
          <span className="desk-figure mt-2 block text-[2rem]">
            {duration(summary.seconds)}
          </span>
          <span className="mt-2 block">
            <Change rate={summary.change.seconds} />
            <span className="ml-1.5 font-sans text-xs text-ink-subtle">on the {days} before</span>
          </span>
        </div>

        <div className="desk-card px-5 py-4">
          <span className="kicker block text-ink-subtle">Read to the end</span>
          {/* A rate only where there is enough behind it to mean one. The
              board refuses to judge a single teaching on fewer than
              ENOUGH_TO_JUDGE readings; the same standard applies to the
              whole site, or it is not a standard. Below the line the
              counts say everything the percentage said, without dressing
              it as a finding. */}
          {enoughToRate(summary.visits) ? (
            <>
              <span className="desk-figure mt-2 block text-[2rem]">
                {percent(summary.finishRate)}
              </span>
              <span className="mt-2 block font-sans text-xs leading-relaxed text-ink-subtle">
                {count(summary.finished)} of {count(summary.visits)} visits reached the foot of the
                page.
              </span>
            </>
          ) : (
            <>
              <span className="desk-figure mt-2 block text-[1.5rem]">
                {count(summary.finished)} of {count(summary.visits)}
              </span>
              <span className="mt-2 block font-sans text-xs leading-relaxed text-ink-subtle">
                Visits that reached the foot of the page. Too few yet to put a rate on — one more
                reader would move it several points.
              </span>
            </>
          )}
        </div>

        <div className="desk-card px-5 py-4">
          <span className="kicker block text-ink-subtle">Average sitting</span>
          <span className="desk-figure mt-2 block text-[2rem]">
            {summary.visits > 0 ? duration(summary.seconds / summary.visits) : '—'}
          </span>
          <span className="mt-2 block font-sans text-xs leading-relaxed text-ink-subtle">
            Engaged time per visit — the page open and the reader in it.
          </span>
        </div>
      </div>

      <ScreenSplit summary={summary} />
    </section>
  )
}

/**
 * Which screen the site is being read on.
 *
 * A bar rather than two more tiles, because the useful fact is the
 * proportion and a proportion is a length before it is a number. The
 * counters are a class of screen, not a class of device: what is
 * recorded is how wide the window was when the page opened, which is the
 * thing the layout answers to. Nothing about the reader is stored — see
 * the note at the head of insight.ts.
 */
function ScreenSplit({ summary }: { summary: WindowSummary }) {
  const { counted, small, large, smallShare, unattributed } = summary.screens

  /* A share needs enough behind it to be a share. One visit drew a
     confident "0% on a phone" with the correction in grey underneath —
     the same fault the finish rate had, in the same band. */
  if (!enoughToRate(counted)) {
    return (
      <p className="desk-card mt-4 px-5 py-4 font-sans text-sm leading-relaxed text-ink-muted">
        {counted === 0
          ? 'No screens counted yet in this stretch.'
          : `Only ${count(counted)} ${counted === 1 ? 'visit has' : 'visits have'} a screen recorded so far — too few to put a share on.`}{' '}
        The split is recorded from the moment a page opens, so it fills in as the site is read;
        visits counted before it shipped carry no screen.
        {unattributed > 0 && ` ${count(unattributed)} here ${unattributed === 1 ? 'is' : 'are'} from before.`}
      </p>
    )
  }

  return (
    <div className="mt-4 desk-card px-5 py-4">
      <span className="kicker block text-ink-subtle">Read on</span>

      <div className="mt-3 flex items-baseline gap-6">
        <span>
          <span className="desk-figure text-[2rem]">
            {percent(smallShare)}
          </span>
          <span className="ml-2 font-sans text-sm font-semibold text-ink-strong">on a phone</span>
        </span>
        <span>
          <span className="desk-figure text-[1.375rem] !text-ink-muted">
            {percent(1 - smallShare)}
          </span>
          <span className="ml-2 font-sans text-sm text-ink-muted">on a wide screen</span>
        </span>
      </div>

      {/* One bar, two lengths. The gold is the phone because that is the
          side most decisions about this site turn on. */}
      <div
        className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-chip"
        role="img"
        aria-label={`${percent(smallShare)} of counted visits opened on a narrow screen`}
      >
        <span className="bg-gold" style={{ width: `${smallShare * 100}%` }} />
        {/* Two fills meeting edge to edge read as one bar changing
            colour. A sliver of the surface between them is what makes
            them two. */}
        <span className="w-[2px] shrink-0 bg-card" />
        <span className="flex-1 bg-plate-soft" />
      </div>

      <p className="mt-3 font-sans text-xs leading-relaxed text-ink-subtle">
        {count(small)} narrow · {count(large)} wide, of {count(counted)} visits with a screen
        recorded.
        {unattributed > 0 && (
          <>
            {' '}
            {count(unattributed)} earlier {unattributed === 1 ? 'visit is' : 'visits are'} not in
            this split — they were counted before the screen was.
          </>
        )}
      </p>

      <p className="mt-2 font-sans text-xs leading-relaxed text-ink-subtle">
        The width of the window when the page opened, not the make of the device. Nothing about a
        reader is stored.
      </p>
    </div>
  )
}

/* ── Band 4 · Where attention goes ────────────────────────────────── */

export function PartsBand({
  parts,
  clicks,
}: {
  parts: PartRow[]
  clicks: { label: string; count: number }[]
}) {
  return (
    <section aria-labelledby="band-parts" className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 id="band-parts" className="font-display text-xl text-ink-strong">
          Where the time goes
        </h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">
          By part of the site, measured in engaged time rather than visits — a hundred teachings
          each read for a minute are worth more of the ministry’s attention than one front page
          glanced at and left.
        </p>
        {parts.length === 0 ? (
          <p className="mt-4 desk-card px-5 py-4 font-sans text-sm text-ink-muted">
            Nothing counted in this stretch yet.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {parts.map((row) => (
              <li key={row.part}>
                <div className="flex items-baseline justify-between gap-4 font-sans text-sm">
                  <span className="font-semibold text-ink-strong">{row.part}</span>
                  <span className="tabular text-ink-muted">
                    {duration(row.seconds)} · {count(row.views)} visits
                  </span>
                </div>
                {/* The bar is the comparison; the numbers beside it are the
                    evidence. Marked presentational because the figures are
                    already read out on the line above it. */}
                <div
                  aria-hidden
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-hairline"
                >
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.max(1, row.share * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="font-display text-xl text-ink-strong">What readers reached for</h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">
          The invitations on the page, and how often each was taken.
        </p>
        {clicks.length === 0 ? (
          <p className="mt-4 desk-card px-5 py-4 font-sans text-sm text-ink-muted">
            Nothing counted in this stretch yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline desk-card">
            {clicks.map((click) => (
              <li
                key={click.label}
                className="flex items-baseline justify-between gap-4 px-5 py-3 font-sans text-sm"
              >
                <span className="text-ink-strong">{CLICK_WORDS[click.label] ?? click.label}</span>
                <span className="tabular font-semibold text-ink-muted">{count(click.count)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

/* ── Band 5 · Is the machinery sound ──────────────────────────────── */

export function HealthBand({
  notes,
}: {
  notes: { level: 'bad' | 'warn' | 'good'; note: string }[]
}) {
  const dot = { bad: 'bg-status-danger', warn: 'bg-status-warning', good: 'bg-status-success' }

  return (
    <section aria-labelledby="band-health">
      <h2 id="band-health" className="font-display text-xl text-ink-strong">
        The machinery
      </h2>
      <ul className="mt-4 divide-y divide-hairline desk-card">
        {notes.map((note) => (
          <li key={note.note} className="flex items-start gap-3 px-5 py-3">
            <span
              aria-hidden
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[note.level]}`}
            />
            <span className="font-sans text-sm leading-relaxed text-ink-muted">
              <span className="sr-only">
                {note.level === 'bad' ? 'Problem: ' : note.level === 'warn' ? 'Warning: ' : 'Good: '}
              </span>
              {note.note}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
