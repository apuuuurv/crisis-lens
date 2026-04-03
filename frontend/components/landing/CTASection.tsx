'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CTASectionProps {
  isAuthenticated: boolean
}

export function CTASection({ isAuthenticated }: CTASectionProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-[min(1200px,calc(100%-1.5rem))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.65 }}
          className="relative overflow-hidden rounded-[40px] border border-border/60 bg-[linear-gradient(135deg,rgba(20,184,166,0.14),rgba(14,165,233,0.16),rgba(59,130,246,0.14))] px-6 py-10 shadow-[0_40px_120px_-55px_rgba(15,23,42,0.6)] sm:px-10 sm:py-14 lg:px-14"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.22),transparent_32%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.2),transparent_32%)]" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-200">
                Final call to action
              </p>
              <h2 className="mt-4 font-[family:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Stay aware. Stay safe.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Make movement feel informed, not uncertain. Join the live awareness network and keep risk visible.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 px-6 text-base text-black"
              >
                <Link href={isAuthenticated ? '/dashboard' : '/register'}>
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6 text-base">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
