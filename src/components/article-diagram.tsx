import * as React from 'react'

/**
 * The drawings a teaching can set into its body.
 *
 * These are drawn rather than photographed. A prophetic chart pasted in as
 * a screenshot is a picture of text: it cannot be searched, a screen
 * reader passes over it in silence, it blurs on a retina screen, and it
 * carries whatever palette its author used straight through the dark
 * theme. Drawn in the page, the same chart is real text in the site's own
 * colours, and every label in it is a label the reader can select.
 *
 * The fields are the one thing not taken from a token. A band of colour
 * whose meaning is the colour — red for tribulation, green for the reign,
 * navy for what has no end — has to hold that meaning in both themes, so
 * the two fixed values below were chosen to carry white type on either
 * ground. Everything else is a token and turns over with the page.
 *
 * A chart is drawn to the measure it will be read at. The reading column
 * is 34rem, so the viewBox is 560 units wide and its type is sized as if
 * those units were pixels — which is what keeps a 10px label a 10px label
 * on the page rather than shrinking it to nothing. Anything that wants
 * small type in quantity, like a column of references, is not drawn at
 * all: it is set as HTML underneath, where it can wrap, reflow onto a
 * phone, and be read out in order.
 */

/* ── The prophetic timeline ──────────────────────────────────────── */

const FIELD = {
  tribulation: '#A93B2D',
  millennium: '#1E7A4E',
} as const

const BAND = { top: 96, height: 58 }
const BOTTOM = BAND.top + BAND.height

/* The chart, left to right, in the units the viewBox is drawn in. */
const X = {
  start: 6,
  cross: 98,
  rapture: 262,
  midTribulation: 308,
  secondComing: 354,
  judgment: 442,
  end: 554,
}

const mid = (a: number, b: number) => (a + b) / 2

/** A square bracket under the band, gathering what it spans. */
function Brace({ from, to }: { from: number; to: number }) {
  return (
    <path
      d={`M ${from} ${BOTTOM + 6} V ${BOTTOM + 15} H ${to} V ${BOTTOM + 6}`}
      fill="none"
      className="stroke-rule-strong"
      strokeWidth={1.2}
    />
  )
}

/** A measured span under the lower half, one era against the rest. */
function Span({ from, to, y }: { from: number; to: number; y: number }) {
  return (
    <g className="stroke-rule-strong" strokeWidth={1} fill="none">
      <path d={`M ${from} ${y - 4} V ${y + 4}`} />
      <path d={`M ${to} ${y - 4} V ${y + 4}`} />
      <path d={`M ${from} ${y} H ${to}`} />
    </g>
  )
}

/** A marker above the band: what happens at this line, and the line. */
function Turning({
  x,
  labelX = x,
  lines,
  y,
  up,
}: {
  x: number
  labelX?: number
  lines: string[]
  y: number
  up?: boolean
}) {
  return (
    <>
      {lines.map((line, i) => (
        <text
          key={line}
          x={labelX}
          y={y + i * 12}
          textAnchor="middle"
          className="fill-navy font-apparatus text-[10px] font-semibold uppercase tracking-[0.08em]"
        >
          {line}
        </text>
      ))}
      <path
        d={
          up
            ? `M ${x} ${BAND.top - 2} V ${y + (lines.length - 1) * 12 + 5}`
            : `M ${x} ${y + (lines.length - 1) * 12 + 5} V ${BAND.top - 2}`
        }
        className="stroke-navy"
        strokeWidth={1.2}
        markerEnd={up ? 'url(#timeline-up)' : 'url(#timeline-down)'}
      />
    </>
  )
}

function PropheticTimeline() {
  return (
    <svg
      viewBox="0 0 560 268"
      role="img"
      aria-labelledby="timeline-title timeline-desc"
      className="block h-auto w-full min-w-[32rem]"
    >
      <title id="timeline-title">The prophetic timeline of God</title>
      <desc id="timeline-desc">
        A chart of the ages, left to right. The cross opens the church age, which runs to the
        rapture. The tribulation follows in two halves of three and a half years, closed by the
        second coming. Then the thousand-year millennial reign of Christ, the great white throne
        judgment, and the eternal state — the new heaven, new earth and new Jerusalem, which has no
        end. Beneath the chart, the present heaven spans everything up to the second coming,
        Christ&apos;s reign spans the thousand years, and the new heaven follows the judgment.
      </desc>

      {/* ── The verse the chart is drawn under ────────────────────── */}
      <text
        x={280}
        y={17}
        textAnchor="middle"
        className="fill-navy font-display text-[15px] uppercase tracking-[0.04em]"
      >
        And we shall be with the Lord forever
      </text>
      <text
        x={280}
        y={32}
        textAnchor="middle"
        className="fill-gold-ink font-apparatus text-[9px] uppercase tracking-[0.2em]"
      >
        1 Thessalonians 4:17
      </text>
      <path d="M 190 40 H 370" className="stroke-gold" strokeWidth={1} opacity={0.55} />

      {/* ── The turning points ────────────────────────────────────── */}
      <Turning x={X.rapture} lines={['Rapture']} y={86} />
      <Turning x={X.secondComing} lines={['Second coming']} y={86} />
      <Turning x={X.judgment} labelX={498} lines={['Great white throne', 'judgment']} y={58} up />

      {/* ── The band ──────────────────────────────────────────────── */}
      {/* Before the cross: hatched, because the chart is not about it. */}
      <rect
        x={X.start}
        y={BAND.top}
        width={X.cross - X.start}
        height={BAND.height}
        fill="url(#timeline-hatch)"
        className="stroke-rule-strong"
        strokeWidth={0.8}
      />
      <rect
        x={X.cross}
        y={BAND.top}
        width={X.rapture - X.cross}
        height={BAND.height}
        className="fill-raised stroke-rule-strong"
        strokeWidth={0.8}
      />
      <rect
        x={X.rapture}
        y={BAND.top}
        width={X.secondComing - X.rapture}
        height={BAND.height}
        fill={FIELD.tribulation}
      />
      <path
        d={`M ${X.midTribulation} ${BAND.top} V ${BOTTOM}`}
        stroke="#ffffff"
        strokeWidth={1.2}
        opacity={0.6}
      />
      <rect
        x={X.secondComing}
        y={BAND.top}
        width={X.judgment - X.secondComing}
        height={BAND.height}
        fill={FIELD.millennium}
      />
      <rect
        x={X.judgment}
        y={BAND.top}
        width={X.end - X.judgment}
        height={BAND.height}
        className="fill-plate"
      />

      {/* The cross stands at the hinge, its foot in the band. */}
      <g className="stroke-navy" strokeWidth={4.5} strokeLinecap="square" fill="none">
        <path d={`M ${X.cross} 58 V ${BOTTOM}`} />
        <path d={`M ${X.cross - 16} 76 H ${X.cross + 16}`} />
      </g>

      <text
        x={mid(X.cross, X.rapture) + 12}
        y={BAND.top + 34}
        textAnchor="middle"
        className="fill-navy font-display text-[14px] uppercase tracking-[0.05em]"
      >
        Church age
      </text>
      <text
        x={mid(X.rapture, X.midTribulation)}
        y={BAND.top + 35}
        textAnchor="middle"
        fill="#ffffff"
        className="font-display text-[14px]"
      >
        3½
      </text>
      <text
        x={mid(X.midTribulation, X.secondComing)}
        y={BAND.top + 35}
        textAnchor="middle"
        fill="#ffffff"
        className="font-display text-[14px]"
      >
        3½
      </text>
      <text
        x={mid(X.secondComing, X.judgment)}
        y={BAND.top + 35}
        textAnchor="middle"
        fill="#ffffff"
        className="font-display text-[13px] uppercase tracking-[0.03em]"
      >
        1000 years
      </text>
      <text
        x={mid(X.judgment, X.end)}
        y={BAND.top + 26}
        textAnchor="middle"
        className="fill-plate-pale font-display text-[12px] uppercase tracking-[0.03em]"
      >
        Eternal
      </text>
      <text
        x={mid(X.judgment, X.end)}
        y={BAND.top + 42}
        textAnchor="middle"
        className="fill-plate-pale font-display text-[12px] uppercase tracking-[0.03em]"
      >
        state
      </text>

      {/* ── What the segments are called ──────────────────────────── */}
      <Brace from={X.rapture} to={X.secondComing} />
      <Brace from={X.secondComing} to={X.judgment} />
      <Brace from={X.judgment} to={X.end} />

      <text
        x={mid(X.rapture, X.secondComing)}
        y={BOTTOM + 29}
        textAnchor="middle"
        fill={FIELD.tribulation}
        className="font-apparatus text-[10px] font-semibold uppercase tracking-[0.08em]"
      >
        Tribulation
      </text>
      {['Millennial reign', 'of Christ'].map((line, i) => (
        <text
          key={line}
          x={mid(X.secondComing, X.judgment)}
          y={BOTTOM + 29 + i * 11}
          textAnchor="middle"
          className="fill-navy font-apparatus text-[9.5px] font-semibold uppercase tracking-[0.07em]"
        >
          {line}
        </text>
      ))}
      {['New heaven', 'new earth', 'new Jerusalem'].map((line, i) => (
        <text
          key={line}
          x={mid(X.judgment, X.end)}
          y={BOTTOM + 29 + i * 11}
          textAnchor="middle"
          className="fill-navy font-apparatus text-[9.5px] font-semibold uppercase tracking-[0.07em]"
        >
          {line}
        </text>
      ))}

      {/* ── Where the dead in Christ are, and when ────────────────── */}
      <text
        x={mid(X.start, X.secondComing)}
        y={BOTTOM + 76}
        textAnchor="middle"
        className="fill-navy font-display text-[14px] uppercase tracking-[0.04em]"
      >
        The present heaven
      </text>
      {['Christ reigning', 'here on earth'].map((line, i) => (
        <text
          key={line}
          x={mid(X.secondComing, X.judgment)}
          y={BOTTOM + 71 + i * 11}
          textAnchor="middle"
          className="fill-navy font-apparatus text-[9.5px] font-semibold uppercase tracking-[0.07em]"
        >
          {line}
        </text>
      ))}
      <text
        x={mid(X.judgment, X.end)}
        y={BOTTOM + 76}
        textAnchor="middle"
        className="fill-navy font-apparatus text-[9.5px] font-semibold uppercase tracking-[0.07em]"
      >
        The new heaven
      </text>

      <Span from={X.start} to={X.secondComing} y={BOTTOM + 90} />
      <Span from={X.secondComing} to={X.judgment} y={BOTTOM + 90} />
      <Span from={X.judgment} to={X.end} y={BOTTOM + 90} />

      <defs>
        <pattern
          id="timeline-hatch"
          width={6}
          height={6}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <path d="M 0 0 V 6" className="stroke-navy" strokeWidth={2} opacity={0.26} />
        </pattern>
        <marker
          id="timeline-down"
          viewBox="0 0 10 10"
          refX={5}
          refY={9}
          markerWidth={5}
          markerHeight={5}
          orient="auto"
        >
          <path d="M 0 0 L 5 9 L 10 0 Z" className="fill-navy" />
        </marker>
        <marker
          id="timeline-up"
          viewBox="0 0 10 10"
          refX={5}
          refY={1}
          markerWidth={5}
          markerHeight={5}
          orient="auto"
        >
          <path d="M 0 10 L 5 1 L 10 10 Z" className="fill-navy" />
        </marker>
      </defs>
    </svg>
  )
}

/* The references the chart's lower half points at. Set as HTML rather
   than drawn: fifteen lines of small type is the one thing an SVG does
   badly, and here they wrap, reflow onto a phone, and are read out in
   order by a screen reader. */
const TIMELINE_KEY: { heading: string; refs: string[] }[] = [
  {
    heading: 'The present heaven',
    refs: ['2 Corinthians 5:6–8', '2 Peter 3:7', 'Luke 23:43', 'Luke 16:19–31', 'John 14:1–3'],
  },
  {
    heading: 'Christ reigning here on earth',
    refs: ['Revelation 20:1–6', 'Isaiah 65:17–20'],
  },
  {
    heading: 'The new heaven',
    refs: ['Revelation 21:1–12', 'Revelation 22:1–12'],
  },
]

function TimelineKey() {
  return (
    <dl className="grid gap-6 border-t border-rule px-6 py-6 font-apparatus sm:grid-cols-3">
      {TIMELINE_KEY.map(({ heading, refs }) => (
        <div key={heading}>
          <dt className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-navy">
            {heading}
          </dt>
          <dd className="text-[0.8125rem] leading-[1.65] text-ink-700">{refs.join(' · ')}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ── The register ────────────────────────────────────────────────── */

const DIAGRAMS: Record<string, { Drawing: () => React.JSX.Element; Key?: () => React.JSX.Element }> =
  {
    'prophetic-timeline': { Drawing: PropheticTimeline, Key: TimelineKey },
  }

/**
 * A body naming a drawing that does not exist renders nothing rather than
 * an empty frame — the same rule the video block follows for a bad id.
 */
export function ArticleDiagram({ name, caption }: { name: string; caption?: string }) {
  const entry = DIAGRAMS[name]
  if (!entry) return null
  const { Drawing, Key } = entry

  return (
    <figure className="my-9 overflow-hidden rounded-panel border border-rule bg-card">
      <div className="overflow-x-auto px-5 py-6">
        <Drawing />
      </div>
      {/* A chart narrower than the phone would be a chart nobody can read,
          so it keeps its size and the frame scrolls — which the reader has
          to be told, because a scrollbar the browser hides is not a hint. */}
      <p className="px-6 pb-4 font-apparatus text-[0.75rem] text-ink-subtle sm:hidden">
        Scroll the chart sideways to follow it to the end.
      </p>
      {Key && <Key />}
      {caption && (
        <figcaption className="border-t border-rule px-6 py-4 font-apparatus text-[0.8125rem] leading-[1.6] text-ink-subtle">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
