'use client'

/**
 * Make a picture small enough to send, in the browser, before sending it.
 *
 * A photograph off a current phone is four thousand pixels wide and
 * several megabytes, and on the connection this ministry's writers
 * actually have that is a minute of watching a spinner in order to
 * upload detail the server will immediately throw away. This does the
 * same fit the server does, so what crosses the network is a few hundred
 * kilobytes rather than eight thousand.
 *
 * It is an optimisation and is treated as one. Everything that can fail
 * here — an old browser, a format the canvas cannot decode, a file that
 * is not really an image — falls straight through to returning the
 * original, which the server handles anyway. A picture is never lost to
 * a clever path.
 */

/** The frame the server resizes to. Matching it avoids a second pass. */
const EDGE = 1600

/** Below this a file is already small enough that re-encoding it is churn. */
const ALREADY_SMALL = 900_000

export async function shrinkImage(file: File): Promise<Blob | File> {
  try {
    if (typeof createImageBitmap !== 'function') return file

    /* `from-image` is what applies the EXIF rotation, and it is the
       whole reason this cannot be skipped for large files: without it a
       photograph taken in portrait arrives on its side, which is the
       single most common thing wrong with a phone upload. */
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, EDGE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < ALREADY_SMALL) {
      bitmap.close()
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return file
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.85)
    )
    /* Only if it actually helped. A small PNG of flat colour can come
       back larger as webp, and sending the bigger one would be silly. */
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

/**
 * Send a picture to the desk's upload route and give back where it went.
 *
 * Shared by the two places a writer can add one — the poster and listing
 * crop fields, and the button in the body editor — because they were
 * drifting apart the moment there were two of them: the first shrank
 * before uploading and the second did not, so the same photograph
 * uploaded from the two of them was stored twice under two addresses.
 */
export async function uploadPicture(
  file: File
): Promise<{ url: string; width?: number; height?: number }> {
  const body = new FormData()
  body.append('file', await shrinkImage(file), file.name || 'upload')
  const response = await fetch('/api/desk/uploads', { method: 'POST', body })
  const payload = (await response.json()) as {
    url?: string
    width?: number
    height?: number
    error?: string
  }
  if (!response.ok || !payload.url) throw new Error(payload.error || 'That upload failed.')
  return { url: payload.url, width: payload.width, height: payload.height }
}
