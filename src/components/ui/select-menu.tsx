'use client'

import * as React from 'react'

/**
 * A small menu that replaces a native `<select>`.
 *
 * The native control was the wrong instrument here for one reason: its
 * popup is drawn by the operating system, not by this page, so in the
 * dark theme it opened as a white sheet with the page's near-white ink on
 * it — options that were, in practice, invisible. A control that cannot
 * be read in one of the two themes the site ships is not a control.
 *
 * So the menu is ours: same shape as the design draws it, same tokens as
 * everything else, legible in both themes by construction. What it has to
 * earn back is everything the native element gave away for free, which is
 * the keyboard —
 *
 *   Enter / Space / ArrowDown  open, landing on the current option
 *   ArrowUp / ArrowDown        move
 *   Home / End                 first, last
 *   Enter / Space              choose
 *   Escape, or a click outside close, and focus returns to the button
 *
 * — and the announcement: the button is a `combobox`, the list is a
 * `listbox`, and the option a reader is on is the one `aria-activedescendant`
 * points at, so a screen reader says the same thing the eye sees.
 */

export interface SelectOption<T extends string> {
  value: T
  label: string
}

export function SelectMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  align = 'end',
}: {
  /** The kicker printed inside the control — "Sort". */
  label: string
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  /** Which edge the menu hangs from, for a control near a page edge. */
  align?: 'start' | 'end'
}) {
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(() =>
    Math.max(0, options.findIndex((option) => option.value === value))
  )
  const root = React.useRef<HTMLDivElement>(null)
  const list = React.useRef<HTMLUListElement>(null)
  const button = React.useRef<HTMLButtonElement>(null)
  const id = React.useId()

  const current = options.find((option) => option.value === value) ?? options[0]

  const close = React.useCallback((returnFocus = true) => {
    setOpen(false)
    if (returnFocus) button.current?.focus()
  }, [])

  /* A click anywhere else is a dismissal, and so is a scroll of the page
     under an open menu — the menu is anchored to a button that has moved. */
  React.useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  React.useEffect(() => {
    if (open) list.current?.focus()
  }, [open])

  const openAt = () => {
    setActive(Math.max(0, options.findIndex((option) => option.value === value)))
    setOpen(true)
  }

  const choose = (index: number) => {
    const option = options[index]
    if (option) onChange(option.value)
    close()
  }

  const onListKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActive((i) => (i + 1) % options.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setActive((i) => (i - 1 + options.length) % options.length)
        break
      case 'Home':
        event.preventDefault()
        setActive(0)
        break
      case 'End':
        event.preventDefault()
        setActive(options.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        choose(active)
        break
      case 'Escape':
        event.preventDefault()
        close()
        break
      case 'Tab':
        close(false)
        break
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        onClick={() => (open ? close() : openAt())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            openAt()
          }
        }}
        /* The select-only combobox pattern: a button carrying the role,
           so assistive technology announces a value that can change
           rather than a button that does something. */
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-labelledby={`${id}-label ${id}-value`}
        className="focus-ring flex items-center gap-2.5 rounded-chip border border-rule bg-card py-2 pl-3.5 pr-3 transition-colors hover:border-gold-pale"
      >
        <span id={`${id}-label`} className="kicker text-ink-subtle">
          {label}
        </span>
        <span id={`${id}-value`} className="text-[0.875rem] font-medium text-ink-900">
          {current?.label}
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          ref={list}
          id={`${id}-listbox`}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={`${id}-option-${active}`}
          onKeyDown={onListKeyDown}
          className={`absolute top-[calc(100%+6px)] z-50 min-w-[11rem] overflow-hidden rounded-tile border border-rule bg-card py-1.5 shadow-glow-soft focus:outline-none ${
            align === 'end' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((option, index) => {
            const selected = option.value === value
            return (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={selected}
                onClick={() => choose(index)}
                onPointerEnter={() => setActive(index)}
                className={`flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[0.875rem] transition-colors ${
                  index === active ? 'bg-chip' : ''
                } ${selected ? 'font-medium text-gold-ink' : 'text-ink-900'}`}
              >
                <Check shown={selected} />
                {option.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-ink-subtle transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  )
}

/* The tick keeps its space whether or not it is drawn, so choosing an
   option does not shift the words beside it. */
function Check({ shown }: { shown: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-gold ${shown ? '' : 'invisible'}`}
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}
