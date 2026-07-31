'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

/**
 * The reading gate: the article opens visible, the rest falls away into a
 * blur, and one animated Read More click unfolds the full flow in place.
 *
 * SEO note: the entire body is server-rendered inside this wrapper — the
 * gate is purely visual (fixed height + overflow hidden), so crawlers and
 * AI engines always receive the complete text.
 */

const COLLAPSED_HEIGHT = 420

export function ArticleGate({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="relative">
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : COLLAPSED_HEIGHT }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: open ? 'auto' : COLLAPSED_HEIGHT }}
        className="relative overflow-hidden"
        aria-expanded={open}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {!open && (
          <motion.div
            key="gate"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-x-0 bottom-0 z-10 flex h-64 items-end justify-center pb-1"
          >
            {/* The remaining text blurs away gradually… */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 backdrop-blur-[3px]"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent, black 55%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 55%)',
              }}
            />
            {/* …and settles into the page background. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, transparent, rgb(var(--app-bg-rgb) / 0.72) 55%, rgb(var(--app-bg-rgb)) 92%)',
              }}
            />

            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
              className="focus-ring relative inline-flex h-12 items-center gap-2 rounded-full bg-gold px-8 font-sans text-base font-semibold text-navy-900 shadow-glow-gold transition-colors hover:bg-gold-light"
            >
              Read More
              <ChevronDown className="h-4 w-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
