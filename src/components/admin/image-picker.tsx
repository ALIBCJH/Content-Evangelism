'use client'

import * as React from 'react'
import { ImageUp, Loader2, X } from 'lucide-react'
import { uploadPicture } from '@/lib/shrink-image'

/**
 * A picture, chosen the way people actually have pictures.
 *
 * The desk asked for a URL, and a URL is the one form in which a writer
 * does not have their photograph. It is on their phone. Asking for a
 * link means asking them to publish the picture somewhere else first,
 * which is a developer's errand handed to whoever is writing the
 * teaching — and it is why so much of this archive went unillustrated.
 *
 * So: choose a file, drop one on the box, or paste one out of the
 * clipboard. On a phone the file input offers the camera and the camera
 * roll without anything here asking it to; that is what `accept` on a
 * file input already means to a mobile browser, and adding `capture`
 * would make it *only* the camera, which is worse.
 *
 * The URL field stays. Some pictures genuinely are already on the
 * internet, and taking that away to add this would be trading one
 * limitation for another — so what a writer sees is a box they can drop
 * a file on, with the address of whatever is in it underneath, editable.
 *
 * The picture is shrunk in the browser before it is sent, and the
 * sending itself is `uploadPicture` — shared with the body editor's own
 * picture button, because the two of them drifted apart the moment there
 * were two: one shrank and one did not, so the same photograph added
 * from the two places was stored twice under two addresses.
 */

export function ImagePicker({
  id,
  value,
  onChange,
  label,
  hint,
  placeholder,
}: {
  id: string
  value: string
  onChange: (url: string) => void
  label: string
  hint: React.ReactNode
  placeholder: string
}) {
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const [over, setOver] = React.useState(false)
  const input = React.useRef<HTMLInputElement>(null)
  const box = React.useRef<HTMLDivElement>(null)

  const send = React.useCallback(
    async (file: File) => {
      setError('')
      setBusy(true)
      try {
        const { url } = await uploadPicture(file)
        onChange(url)
      } catch (thrown) {
        setError(thrown instanceof Error ? thrown.message : 'That upload failed.')
      } finally {
        setBusy(false)
      }
    },
    [onChange]
  )

  /* Paste, but only while the box has focus — a writer pasting a
     screenshot into the body should not have it land in the poster
     field because this component was listening to the whole window. */
  React.useEffect(() => {
    const node = box.current
    if (!node) return
    const onPaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? [])[0]
      if (file?.type.startsWith('image/')) {
        event.preventDefault()
        void send(file)
      }
    }
    node.addEventListener('paste', onPaste)
    return () => node.removeEventListener('paste', onPaste)
  }, [send])

  const drop = (event: React.DragEvent) => {
    event.preventDefault()
    setOver(false)
    const file = Array.from(event.dataTransfer.files).find((f) => f.type.startsWith('image/'))
    if (file) void send(file)
  }

  return (
    <div>
      <label htmlFor={id} className="font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted">
        {label}
      </label>

      <div
        ref={box}
        tabIndex={-1}
        onDragOver={(event) => {
          event.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        className={`mt-2 rounded-2xl border border-dashed p-3 transition-colors ${
          over ? 'border-gold bg-gold/5' : 'border-hairline bg-surface'
        }`}
      >
        {value ? (
          <div className="flex items-center gap-3">
            {/* A plain img, not next/image: this is the desk looking at
                what it just chose, the file is already the right size,
                and the optimiser would be a round trip to show a
                thumbnail of something we have in hand. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-16 w-24 shrink-0 rounded-lg border border-hairline bg-surface-2 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[0.6875rem] text-ink-subtle">{value}</p>
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="focus-ring mt-1 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
              >
                Replace
              </button>
            </div>
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label={`Remove the ${label.toLowerCase()}`}
              className="focus-ring rounded-full p-1.5 text-ink-subtle transition-colors hover:text-gold"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl px-3 py-5 font-sans text-sm text-ink-muted transition-colors hover:text-gold disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
            {busy ? 'Uploading…' : 'Choose a picture, or drop one here'}
          </button>
        )}

        <input
          ref={input}
          id={id}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            /* Cleared so choosing the same file twice fires again —
               after a failed upload, picking it again is the obvious
               thing to try and it silently did nothing. */
            event.target.value = ''
            if (file) void send(file)
          }}
        />
      </div>

      {/* The address of whatever is in the box, and a place to put one
          by hand for a picture that is already on the internet. */}
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={`${label} address`}
        className="focus-ring mt-2 w-full rounded-xl border border-hairline bg-surface px-3 py-2 font-mono text-[0.75rem] text-ink-strong placeholder:text-ink-subtle"
      />

      {error ? (
        <p role="alert" className="mt-2 font-sans text-xs text-status-danger">
          {error}
        </p>
      ) : (
        <p className="mt-2 font-sans text-xs text-ink-subtle">{hint}</p>
      )}
    </div>
  )
}
