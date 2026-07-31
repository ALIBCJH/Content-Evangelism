import * as React from 'react'

/**
 * Server-rendered JSON-LD structured data.
 *
 * Structured data must be present in the initial HTML: AI search crawlers
 * (GPTBot, ClaudeBot, PerplexityBot) and most indexers do not execute
 * JavaScript, so client-side injection is invisible to them. React escapes
 * text children of <script>, which corrupts JSON — so the serialized graph
 * is emitted as raw HTML after being sanitized by `serializeJsonLd`.
 *
 * Sanitization: every HTML-significant character (<, >, &) plus the JS
 * line separators U+2028/U+2029 is replaced with its \uXXXX escape, which
 * is valid JSON and inert in HTML. A "</script>" sequence can therefore
 * never appear in the output, regardless of what the data contains.
 */
function serializeJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
