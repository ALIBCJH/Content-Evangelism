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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/admin', '/api/'],
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
