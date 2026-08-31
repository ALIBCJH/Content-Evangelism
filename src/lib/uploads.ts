import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Pictures a writer picked off their own phone or laptop.
 *
 * The desk asked for a URL. That is a fine thing to ask a developer and
 * an unreasonable thing to ask the person writing the teaching: it means
 * the picture has to be somewhere on the internet *before* it can go in
 * the article, so a photograph taken on a phone has to be mailed to
 * somebody, put in a folder, committed, and deployed before a sentence
 * can be written round it. Every teaching on this site got its artwork
 * that way, and it is why nine of fifteen rows spent a month as coloured
 * fields.
 *
 * So the desk takes the file. This is where it goes.
 *
 * ## Where the bytes live
 *
 * Not in `public/`. The site runs on a read-only filesystem in
 * production, so a file written there at eleven o'clock is gone at the
 * next deploy, and writing one at all would fail. What the deployment
 * does have is the same Upstash store the teachings are in, which speaks
 * Redis over HTTPS — so an upload is a base64 string under `upload:<id>`
 * and its shape is a small JSON record beside it. With no store
 * configured — which is every local checkout — they go to `data/uploads`
 * instead, next to the local articles and gitignored with them.
 *
 * Redis is not an image host and nobody should pretend otherwise. What
 * makes it a reasonable one here is the encoding below: a teaching
 * carries one or two pictures, each a couple of hundred kilobytes after
 * `encode`, against article bodies already in the same store at sixty.
 * If the archive ever grows a gallery this wants to become object
 * storage, and the seam to change is `putBytes`/`getBytes` — nothing
 * above them knows where a picture is kept.
 *
 * ## Why the bytes are re-encoded rather than stored as they arrive
 *
 * A photograph off a modern phone is four thousand pixels wide, eight
 * megabytes, and rotated by an EXIF tag that half the pipeline honours
 * and half does not. None of that can be published as-is. So every
 * upload is rotated upright, resized to fit the largest frame the site
 * actually draws, re-encoded as webp and stripped of its metadata —
 * which also takes the location the camera wrote into it, and a
 * teaching's artwork should not carry the photographer's house.
 */

export interface Upload {
  id: string
  /** Where the site serves it — see `app/uploads/[file]/route.ts`. */
  url: string
  width: number
  height: number
  /** Encoded size, so the desk can say what it did. */
  bytes: number
}

/* Both halves or neither, exactly as `posted.ts` reads them. */
const KV_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? ''
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const usingKv = Boolean(KV_URL && KV_TOKEN)

const DIR = path.join(process.cwd(), 'data', 'uploads')

/** The most an upload may weigh before it is refused unread. */
export const MAX_UPLOAD = 20 * 1024 * 1024

/**
 * The frames to try, in order, until one is small enough to store.
 *
 * The first is the size the site actually draws a poster at — 1600 is
 * comfortably above the 1200-wide lead and the 1008 listing crop, so a
 * picture is never upscaled. The others exist for the photograph that is
 * mostly detail and will not compress: better a slightly smaller picture
 * than a refusal the writer cannot act on.
 */
const LADDER = [
  { edge: 1600, quality: 82 },
  { edge: 1400, quality: 74 },
  { edge: 1100, quality: 66 },
]

/**
 * The most an encoded picture may weigh.
 *
 * Upstash sends commands over HTTPS with a request-size limit, and
 * base64 adds a third on top of whatever this is. 600 KB leaves room
 * under a 1 MB ceiling and is four times what any picture on the site
 * currently weighs.
 */
const MAX_STORED = 600 * 1024

const KEY = (id: string) => `upload:${id}`
const META = (id: string) => `upload:${id}:meta`

async function kvCommand(command: (string | number)[]): Promise<unknown> {
  const response = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Upstash ${command[0]} returned ${response.status}.`)
  const payload = (await response.json()) as { result?: unknown; error?: string }
  if (payload.error) throw new Error(payload.error)
  return payload.result ?? null
}

/* ── the seam ──────────────────────────────────────────────────────── */

async function putBytes(id: string, buffer: Buffer, shape: Omit<Upload, 'url'>) {
  const meta = JSON.stringify(shape)
  if (usingKv) {
    await kvCommand(['SET', KEY(id), buffer.toString('base64')])
    await kvCommand(['SET', META(id), meta])
    return
  }
  await fs.mkdir(DIR, { recursive: true })
  await fs.writeFile(path.join(DIR, `${id}.webp`), buffer)
  await fs.writeFile(path.join(DIR, `${id}.json`), meta)
}

async function getBytes(id: string): Promise<Buffer | null> {
  if (usingKv) {
    const held = (await kvCommand(['GET', KEY(id)])) as string | null
    return held ? Buffer.from(held, 'base64') : null
  }
  return fs.readFile(path.join(DIR, `${id}.webp`)).catch(() => null)
}

/* ── what the rest of the site uses ────────────────────────────────── */

/** Every upload is a webp, so one extension and no content sniffing. */
export const UPLOAD_PREFIX = '/uploads/'

/** Whether a path is one of ours, for anything that has to tell. */
export function isUpload(url: string): boolean {
  return /^\/uploads\/[0-9a-f]{32}\.webp$/.test(url)
}

function idFrom(file: string): string | null {
  const match = /^([0-9a-f]{32})\.webp$/.exec(file)
  return match ? match[1] : null
}

/**
 * Rotate upright, fit the frame, re-encode, and go down the ladder until
 * the result will fit in the store.
 *
 * `withoutEnlargement` matters: a small picture stays its own size rather
 * than being blown up to 1600 and stored at four times the weight it
 * needed, having gained no detail on the way.
 */
async function encode(input: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
  const sharp = (await import('sharp')).default
  let last: { buffer: Buffer; width: number; height: number } | null = null

  for (const { edge, quality } of LADDER) {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true })
    last = { buffer: data, width: info.width, height: info.height }
    if (data.byteLength <= MAX_STORED) return last
  }

  if (!last) throw new Error('That file could not be read as a picture.')
  throw new Error(
    'That picture is too detailed to store even at reduced size. Crop it, or save it smaller, and try again.'
  )
}

/**
 * Take a file the writer chose and give back where it now lives.
 *
 * Content-addressed: the id is a hash of the encoded bytes, so the same
 * photograph uploaded twice is stored once and keeps one URL, and a URL
 * can be cached forever because its contents can never change.
 */
export async function putUpload(input: Buffer): Promise<Upload> {
  const { buffer, width, height } = await encode(input)
  const id = createHash('sha256').update(buffer).digest('hex').slice(0, 32)
  const shape = { id, width, height, bytes: buffer.byteLength }
  await putBytes(id, buffer, shape)
  return { ...shape, url: `${UPLOAD_PREFIX}${id}.webp` }
}

/** The bytes behind a `/uploads/…` filename, or null where there are none. */
export async function readUpload(file: string): Promise<Buffer | null> {
  const id = idFrom(file)
  return id ? getBytes(id) : null
}

/**
 * How big an uploaded picture is, without reading the picture.
 *
 * Structured data declares an image's dimensions so Google will serve a
 * large preview, and it reads them off disk for anything under `public/`.
 * An upload is not on disk, so without this every teaching illustrated
 * from the desk would quietly lose its large preview — see
 * `localDimensions` in `lib/images.ts`.
 */
export async function uploadShape(url: string): Promise<{ width: number; height: number } | null> {
  if (!isUpload(url)) return null
  const id = idFrom(url.slice(UPLOAD_PREFIX.length))
  if (!id) return null
  try {
    const held = usingKv
      ? ((await kvCommand(['GET', META(id)])) as string | null)
      : await fs.readFile(path.join(DIR, `${id}.json`), 'utf8').catch(() => null)
    if (!held) return null
    const shape = JSON.parse(held) as { width?: number; height?: number }
    return shape.width && shape.height ? { width: shape.width, height: shape.height } : null
  } catch {
    return null
  }
}
