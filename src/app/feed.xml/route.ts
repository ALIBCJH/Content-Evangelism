import { siteInfo, siteUrl } from '@/lib/content'
import { listRealRows } from '@/lib/rows'
import { bodyToHtml, escapeXml } from '@/lib/article-body'
import { absoluteUrl } from '@/lib/seo'

/**
 * RSS 2.0 for the whole archive.
 *
 * A publication without a feed is invisible to aggregators, to the readers
 * who follow ministries by feed rather than by algorithm, and to several
 * of the AI crawlers that prefer a feed over walking the sitemap. The full
 * article HTML rides in content:encoded so a reader gets the teaching
 * itself rather than a teaser.
 */

/* Rebuilt at most every five minutes; the posting desk revalidates this
   path on publish, so a new article appears immediately regardless. */
export const revalidate = 300

/** RFC-822, the date format RSS requires. */
const rfc822 = (iso: string) => new Date(iso).toUTCString()

export async function GET() {
  const rows = await listRealRows()
  const updated = rows[0]?.publishedAt ?? new Date().toISOString()

  const items = rows
    .map((row) => {
      const url = `${siteUrl}${row.href}`
      const html = row.body ? bodyToHtml(row.body, siteUrl) : `<p>${escapeXml(row.dek)}</p>`
      const image = row.imageUrl ? absoluteUrl(row.imageUrl) : null

      return `    <item>
      <title>${escapeXml(row.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${rfc822(row.publishedAt)}</pubDate>
      <category>${escapeXml(row.category)}</category>
      <dc:creator>${escapeXml(row.authorName)}</dc:creator>
      <description>${escapeXml(row.dek)}</description>
      <content:encoded><![CDATA[${html.replace(/]]>/g, ']]&gt;')}]]></content:encoded>${
        image
          ? `\n      <enclosure url="${escapeXml(image)}" type="image/jpeg" length="0" />`
          : ''
      }
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteInfo.name)}</title>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(siteInfo.mission)}</description>
    <language>en</language>
    <copyright>${escapeXml(`© ${new Date().getFullYear()} ${siteInfo.ministry}`)}</copyright>
    <lastBuildDate>${rfc822(updated)}</lastBuildDate>
    <image>
      <url>${siteUrl}/icons/icon-512.png</url>
      <title>${escapeXml(siteInfo.name)}</title>
      <link>${siteUrl}</link>
    </image>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
