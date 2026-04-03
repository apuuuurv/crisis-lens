'use client'

import { motion } from 'framer-motion'
import { AlertCircle, ArrowUpRight, BellRing, Siren, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const incidents = [
  { title: 'Flooded underpass', meta: 'Library Road', time: '2m ago', tone: 'bg-rose-500' },
  { title: 'Traffic collision', meta: 'South Gate', time: '6m ago', tone: 'bg-amber-500' },
  { title: 'Streetlight outage', meta: 'Block C', time: '12m ago', tone: 'bg-emerald-500' },
]

export function LivePreview() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-[min(1200px,calc(100%-1.5rem))]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65 }}
          className="mb-10 flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end"
        >
          <div>
            <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-emerald-700 dark:text-emerald-200">
              Live operations preview
            </Badge>
            <h2 className="mt-4 font-[family:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              The dashboard gives context, not just notifications
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Risk scoring, incidents, and priority alerts are layered into a single view so users can decide quickly.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 dark:text-rose-200">
            <span className="inline-flex size-2 rounded-full bg-rose-500" />
            LIVE
          </div>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="h-full rounded-[28px] border-border/60 bg-background/75 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle>Risk Level</CardTitle>
                  <TriangleAlert className="size-5 text-rose-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-[24px] bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 p-6 text-white">
                  <p className="text-sm uppercase tracking-[0.18em] text-white/75">Current zone status</p>
                  <p className="mt-4 font-[family:var(--font-display)] text-4xl font-semibold">Moderate</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-white/85">
                    Increased activity reported around the south corridor. Avoid detours near closed roads.
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Trend</p>
                    <p className="text-sm text-muted-foreground">Down 12% from last hour</p>
                  </div>
                  <ArrowUpRight className="size-5 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="h-full rounded-[28px] border-border/60 bg-background/75 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle>Incident List</CardTitle>
                  <AlertCircle className="size-5 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {incidents.map((incident) => (
                  <div
                    key={incident.title}
                    className="flex items-center gap-4 rounded-[22px] border border-border/60 px-4 py-4 transition-colors hover:bg-accent/50"
                  >
                    <div className={`h-3 w-3 rounded-full ${incident.tone}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{incident.title}</p>
                      <p className="text-sm text-muted-foreground">{incident.meta}</p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{incident.time}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, delay: 0.14 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="h-full rounded-[28px] border-border/60 bg-background/75 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle>Alerts</CardTitle>
                  <BellRing className="size-5 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <Siren className="size-5 text-amber-600 dark:text-amber-300" />
                    <div>
                      <p className="text-sm font-semibold">High-priority notice</p>
                      <p className="text-sm text-muted-foreground">Shuttle route rerouted near Main Hall.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[24px] border border-border/60 p-4">
                  <p className="text-sm font-semibold text-foreground">Push alert sent</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    1,482 users notified within 9 seconds of incident verification.
                  </p>
                </div>
                <div className="rounded-[24px] border border-border/60 p-4">
                  <p className="text-sm font-semibold text-foreground">Next automation</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Route-safe suggestions update automatically when congestion or closures change.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
