import path from 'node:path'
import { absoluteUrl } from '@/lib/seo'
import { uploadShape } from '@/lib/uploads'

/**
 * Structured-data image objects.
 *
 * Google will only serve a large image preview when it can see the image
 * is big enough, and it reads the declared dimensions to decide. Local
 * files are measured off disk once per revalidation; remote files are
 * emitted without dimensions rather than with guessed ones.
 */

export interface SchemaImage {
  '@type': 'ImageObject'
  url: string
  contentUrl: string
  width?: number
  height?: number
  caption?: string
}

async function localDimensions(
  imageUrl: string
): Promise<{ width: number; height: number } | null> {
  if (!imageUrl.startsWith('/')) return null

  /* A picture uploaded at the desk is not in `public/` — it is in the
     store, with its shape recorded beside it. Without this, every
     teaching illustrated from the desk would quietly lose the large
     search preview that the dimensions below exist to earn. */
  const uploaded = await uploadShape(imageUrl)
  if (uploaded) return uploaded

  try {
    // Imported lazily so the client bundle never pulls sharp in.
    const sharp = (await import('sharp')).default
    const file = path.join(process.cwd(), 'public', imageUrl)
    const { width, height } = await sharp(file).metadata()
    return width && height ? { width, height } : null
  } catch {
    // Missing file, unreadable, or an unsupported format — the image still
    // gets declared, just without dimensions.
    return null
  }
}

export async function schemaImage(
  imageUrl: string,
  caption?: string
): Promise<SchemaImage> {
  const url = absoluteUrl(imageUrl)
  const size = await localDimensions(imageUrl)
  return {
    '@type': 'ImageObject',
    url,
    contentUrl: url,
    ...(size ?? {}),
    ...(caption ? { caption } : {}),
  }
}
