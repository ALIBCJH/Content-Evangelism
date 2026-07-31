'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CopyVerseButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable (permissions/insecure context) — quietly ignore.
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} aria-live="polite">
      {copied ? <Check className="text-status-success" /> : <Copy />}
      {copied ? 'Copied to share' : 'Copy the verse'}
    </Button>
  )
}
