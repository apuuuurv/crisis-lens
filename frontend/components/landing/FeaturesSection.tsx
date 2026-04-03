'use client'

import { motion } from 'framer-motion'
import { Bell, Bot, Flame, Map, Radar, UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Radar,
    title: 'Real-Time Incident Tracking',
    description: 'Monitor verified reports and live conditions around you as they change minute by minute.',
  },
  {
    icon: Bot,
    title: 'AI-Based Analysis',
    description: 'Automatically categorize incidents, estimate severity, and highlight what needs attention first.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Push only the alerts that matter based on proximity, severity, and user context.',
  },
  {
    icon: Flame,
    title: 'Risk Level Indicator',
    description: 'Show a clear visual risk state so users can understand safety conditions at a glance.',
  },
  {
    icon: Map,
    title: 'Heatmap Visualization',
    description: 'Reveal clusters, hotspots, and area-wide patterns with a polished geospatial view.',
  },
  {
    icon: UsersRound,
    title: 'Community Reporting',
    description: 'Let students and staff contribute useful, location-aware reports with a moderation layer.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24">
      <div className="mx-auto w-[min(1200px,calc(100%-1.5rem))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge className="rounded-full border border-border/60 bg-background/60 px-4 py-1">
            Features
          </Badge>
          <h2 className="mt-4 font-[family:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built like a real safety product, not a static notice board
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Every feature is designed to reduce uncertainty and help users move with more confidence.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.45 }}
            >
              <Card className="h-full rounded-[28px] border-border/60 bg-background/75 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-400/15 to-lime-400/15 text-emerald-600 dark:text-emerald-300">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
