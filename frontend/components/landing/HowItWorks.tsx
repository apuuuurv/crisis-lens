'use client'

import { motion } from 'framer-motion'
import { Bot, ScanSearch, Siren } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const steps = [
  {
    icon: ScanSearch,
    title: 'Report or detect incident',
    description: 'User reports, sensor data, or response teams trigger a new incident event.',
  },
  {
    icon: Bot,
    title: 'AI processes and categorizes',
    description: 'The system scores severity, tags the event type, and prepares recommended actions.',
  },
  {
    icon: Siren,
    title: 'Users get alerts and insights',
    description: 'People nearby receive a clear alert, risk context, and safer next steps.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="mx-auto w-[min(1200px,calc(100%-1.5rem))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge className="rounded-full border border-border/60 bg-background/60 px-4 py-1">
            How It Works
          </Badge>
          <h2 className="mt-4 font-[family:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Simple flow, high-confidence decisions
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            The product turns raw reports into fast, usable incident awareness in three steps.
          </p>
        </motion.div>

        <div className="relative mt-14 grid gap-8 lg:grid-cols-3">
          <div className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-11 hidden h-px bg-gradient-to-r from-emerald-400/10 via-emerald-500/40 to-lime-400/10 lg:block" />
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="relative rounded-[32px] border border-border/60 bg-background/75 p-7 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-lime-400 text-black shadow-lg shadow-emerald-500/20">
                <step.icon className="size-6" />
              </div>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-sm font-semibold text-muted-foreground">
                  0{index + 1}
                </span>
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
