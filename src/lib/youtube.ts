/**
 * The two YouTube URLs the site ever builds.
 *
 * Every embed goes through the no-cookie host: a reader who opens a
 * teaching has not asked to be tracked by a third party, and the privacy
 * domain is the same player.
 */
export const embedSrc = (id: string): string =>
  `https://www.youtube-nocookie.com/embed/${id}`

export const watchHref = (id: string): string =>
  `https://www.youtube.com/watch?v=${id}`

/** The poster frame — used wherever a recording is listed rather than played. */
export const posterSrc = (id: string): string =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
