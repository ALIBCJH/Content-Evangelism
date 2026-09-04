'use client'

import * as React from 'react'
import type { GlossaryEntry } from '@/lib/glossary'

/**
 * A technical term that explains itself where it stands.
 *
 * The page this exists for describes twenty years of laboratory work, and
 * its argument is that the record can be checked. "The Nrf2 transcription
 * factor and the antioxidant response element" is a wall to almost every
 * reader, and a reader who meets three of those in a paragraph stops
 * reading and takes the claim on trust — which is the opposite of what
 * the page is for.
 *
 * A link out to an encyclopedia would cost the reader their place on the
 * page and hand them something written for specialists. This keeps them
 * where they are.
 *
 * ## Three ways in, because there are three kinds of reader
 *
 * A pointer hovers. A finger taps — so the term is a real `<button>` and
 * a tap toggles it, which a CSS-only hover card cannot do at all. A
 * keyboard focuses, and Escape closes. All three drive one piece of
 * state, and the work is in keeping them from driving it at once.
 *
 * A tap on a touch screen fires a synthesised `mouseenter` and a `focus`
 * before it fires `click`. Hang opening on all three and the card opens
 * on the phantom hover and is closed again by the tap that asked for it —
 * which is exactly what it did until this was written down. So hover is
 * filtered to a real mouse, focus opens only when it is the keyboard's
 * kind of focus, and the tap is left alone to toggle.
 *
 * The card is rendered only while it is open. There are eighteen of these
 * on the page it was built for; eighteen hidden panels of prose in the
 * document at all times would be eighteen paragraphs a screen reader has
 * to walk past, and the same again in the page's own weight.
 *
 * It opens upward when there is no room below. A definition that opens
 * off the bottom of a phone is a definition nobody reads.
 */
/* The card's own box, in the numbers the clamping needs. Kept beside the
   class that draws it — if one changes the other has to. */
const CARD_WIDTH = 320
const CARD_HEIGHT = 260
const MARGIN = 16

export function GlossaryTerm({ text, entry }: { text: string; entry: GlossaryEntry }) {
  const [open, setOpen] = React.useState(false)
  const [above, setAbove] = React.useState(false)
  /* How far the card has to slide out of dead-centre to stay on screen. */
  const [shift, setShift] = React.useState(0)
  const anchor = React.useRef<HTMLSpanElement>(null)
  const leaving = React.useRef<ReturnType<typeof setTimeout>>()
  const id = React.useId()

  /* Decided at the moment of opening rather than on every scroll: the
     card is short-lived and the page underneath it is not moving. */
  const show = React.useCallback(() => {
    clearTimeout(leaving.current)
    const box = anchor.current?.getBoundingClientRect()
    if (box) {
      setAbove(window.innerHeight - box.bottom < CARD_HEIGHT && box.top > CARD_HEIGHT)

      /* Centred on the word, then pushed back inside the screen. A term
         near the left margin of a phone is the common case, not the
         edge case: centre the card on it and a third of the definition
         is off the side of the display. */
      const width = Math.min(CARD_WIDTH, window.innerWidth - MARGIN * 2)
      const centred = box.left + box.width / 2 - width / 2
      const clamped = Math.min(
        Math.max(centred, MARGIN),
        window.innerWidth - width - MARGIN
      )
      setShift(clamped - centred)
    }
    setOpen(true)
  }, [])

  /* A moment's grace on the way out, so crossing the gap between the word
     and its card does not close the thing the reader is reaching for. */
  const hide = React.useCallback(() => {
    clearTimeout(leaving.current)
    leaving.current = setTimeout(() => setOpen(false), 120)
  }, [])

  React.useEffect(() => () => clearTimeout(leaving.current), [])

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <span
      ref={anchor}
      className="relative inline-block"
      onPointerEnter={(event) => event.pointerType === 'mouse' && show()}
      onPointerLeave={(event) => event.pointerType === 'mouse' && hide()}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        data-track="open-glossary"
        onClick={() => (open ? setOpen(false) : show())}
        /* Only the keyboard's kind of focus. A tap focuses too, and a
           card that opened on that would be closed by the tap's own
           click a moment later. */
        onFocus={(event) => event.currentTarget.matches(':focus-visible') && show()}
        onBlur={hide}
        className="focus-ring cursor-help border-b border-dashed border-gold/70 text-inherit transition-colors hover:border-gold hover:text-gold-ink"
      >
        {text}
      </button>

      {open && (
        <span
          id={id}
          role="tooltip"
          /* The card is inside the button's own hover region, so moving
             on to it keeps it open. */
          style={{ transform: `translateX(calc(-50% + ${Math.round(shift)}px))` }}
          className={`absolute left-1/2 z-30 w-[min(20rem,calc(100vw-2rem))] rounded-panel border border-rule bg-card p-4 text-left shadow-glow-soft ${
            above ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <span className="kicker block text-gold-ink">{entry.term}</span>
          <span className="mt-2 block font-apparatus text-[0.8125rem] leading-[1.6] text-ink-700">
            {entry.gloss}
          </span>
        </span>
      )}
    </span>
  )
}
