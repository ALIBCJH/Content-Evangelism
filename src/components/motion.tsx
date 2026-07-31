'use client'

import * as React from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Scroll-reveal primitives. One orchestrated rise per section — restrained,
 * editorial motion rather than scattered effects.
 */

const EASE = [0.22, 1, 0.36, 1] as const

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 20,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  y = 22,
}: {
  children: React.ReactNode
  className?: string
  y?: number
}) {
  const reduce = useReducedMotion()
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y },
    show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
  }
  return (
    <motion.div className={cn(className)} variants={item}>
      {children}
    </motion.div>
  )
}
