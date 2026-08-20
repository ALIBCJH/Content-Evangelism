import { siteUrl } from '@/lib/content'

/** A GET against a v1 route handler, as the deployment would deliver it. */
export function get(path: string): Request {
  return new Request(`${siteUrl}${path}`)
}

export async function body<T = any>(response: Response): Promise<T> {
  return (await response.json()) as T
}
