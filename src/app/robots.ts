import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/content'

/* The site exists to be read — by people and by the AI engines that answer
   questions about the ministry. Everything public is crawlable; the AI
   crawlers are named explicitly so the welcome is unambiguous, since some
   default to caution when only a wildcard rule exists. */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'meta-externalagent',
]

/* The public content API is meant to be found. Everything else under
   /api is the desk's — the posting routes, the question queue, the page
   counter — and stays disallowed, so an agent that reads this file knows
   exactly which door is for it. Allow rules are listed before the
   disallow they carve out of, which is how the more specific rule wins. */
const ALLOW = ['/', '/api/v1/', '/api/openapi.json']
const DISALLOW = ['/admin', '/api/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: ALLOW, disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ALLOW,
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
