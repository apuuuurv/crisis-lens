'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

interface AnimatedCounterProps {
  value: number
  suffix?: string
}

function AnimatedCounter({ value, suffix = '' }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const isInView = useInView(ref, { once: true, amount: 0.7 })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let frame = 0
    const totalFrames = 40
    const interval = window.setInterval(() => {
      frame += 1
      const progress = frame / totalFrames
      setCount(Math.round(value * progress))

      if (frame >= totalFrames) {
        window.clearInterval(interval)
        setCount(value)
      }
    }, 28)

    return () => window.clearInterval(interval)
  }, [isInView, value])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

export function StatsSection() {
  const stats = [
    { value: 1840, suffix: '+', label: 'Incidents reported', copy: 'Across active zones, with verification and triage pipelines.' },
    { value: 12600, suffix: '+', label: 'Active users', copy: 'People and response teams using live safety visibility.' },
    { value: 9, suffix: 's', label: 'Response time', copy: 'Average time to deliver high-priority awareness alerts nearby.' },
  ]

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-[min(1200px,calc(100%-1.5rem))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge className="rounded-full border border-border/60 bg-background/60 px-4 py-1">
            Trust by the numbers
          </Badge>
          <h2 className="mt-4 font-[family:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A product that feels alive because it is
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            The experience is designed to feel responsive, current, and operational from the first glance.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="rounded-[32px] border border-border/60 bg-background/75 p-7 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl"
            >
              <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
              <p className="mt-6 font-[family:var(--font-display)] text-5xl font-semibold tracking-tight text-foreground">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{stat.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
