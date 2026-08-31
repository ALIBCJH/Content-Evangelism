import { NextResponse } from 'next/server'
import { authorizedForDesk, deskToken } from '@/lib/posted'
import { MAX_UPLOAD, putUpload } from '@/lib/uploads'

/**
 * A picture, straight off the writer's phone or laptop.
 *
 * Either desk may use it. Attaching a photograph is not deciding what is
 * on the site — nothing is published by this route, and an upload
 * nobody references is a few hundred kilobytes nobody sees — so gating
 * it behind the review key would mean a writer could compose a teaching
 * but not illustrate it, which is the problem this was built to fix.
 *
 * What it will not do is take a file on anybody's word. The type a
 * browser declares is a hint the browser got from the file extension;
 * what settles it is whether the bytes decode as an image, which is
 * exactly what `putUpload` has to do anyway in order to re-encode them.
 * So there is no allowlist of MIME types here: a PDF renamed `.jpg`
 * fails to decode and is refused with the same message a genuinely
 * broken photograph gets.
 */
export const dynamic = 'force-dynamic'

/* Nothing on this route is cacheable and every call writes, so the
   runtime has to be the node one — `sharp` is not available on the edge. */
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const token = await deskToken(request)
  if (!authorizedForDesk(token)) {
    return NextResponse.json({ error: 'A desk key is required.' }, { status: 401 })
  }

  let file: unknown
  try {
    const form = await request.formData()
    file = form.get('file')
  } catch {
    return NextResponse.json({ error: 'That upload could not be read.' }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file was attached.' }, { status: 400 })
  }

  /* Checked before the bytes are read into memory rather than after: the
     point of a limit is not to be told how far past it we already are. */
  if (file.size > MAX_UPLOAD) {
    return NextResponse.json(
      { error: `That file is ${Math.round(file.size / 1024 / 1024)}MB. The limit is ${MAX_UPLOAD / 1024 / 1024}MB.` },
      { status: 413 }
    )
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 })
  }

  try {
    const upload = await putUpload(Buffer.from(await file.arrayBuffer()))
    return NextResponse.json({ ok: true, ...upload }, { status: 201 })
  } catch (error) {
    /* `putUpload` throws two kinds of thing: a picture too dense to
       store, which says so and is worth passing on, and sharp failing to
       decode, which says something about libvips that helps nobody. */
    const message = error instanceof Error ? error.message : ''
    const readable = message.startsWith('That picture is too detailed')
      ? message
      : 'That file could not be read as a picture. JPEG, PNG, WebP and an iPhone HEIC all work.'
    return NextResponse.json({ error: readable }, { status: 400 })
  }
}
