'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, BellRing, MapPinned, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  isAuthenticated: boolean
}

const incidents = [
  { label: 'Flooded crosswalk', level: 'High', position: 'left-[18%] top-[26%]' },
  { label: 'Power outage', level: 'Medium', position: 'left-[62%] top-[34%]' },
  { label: 'Road closure', level: 'Low', position: 'left-[48%] top-[66%]' },
]

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <section id="home" className="relative overflow-hidden pb-14 pt-10 sm:pb-20 sm:pt-16">
      <div className="mx-auto grid w-[min(1200px,calc(100%-1.5rem))] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10"
        >
          <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-emerald-700 dark:text-emerald-200">
            Real-time incident awareness platform
          </Badge>
          <h1 className="mt-6 max-w-2xl font-[family:var(--font-display)] text-5xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl lg:text-7xl">
            Real-Time Safety Starts Around You
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Stay informed about incidents near you. Know the risks. Act fast.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 px-6 text-base text-black shadow-[0_20px_50px_-20px_rgba(34,197,94,0.65)] hover:scale-[1.01]"
            >
              <Link href={isAuthenticated ? '/dashboard' : '/register'}>
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 text-base">
              <Link href="/dashboard">View Live Dashboard</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldAlert, title: 'Dynamic risk scoring', copy: 'Signals from reports, AI triage, and nearby activity.' },
              { icon: BellRing, title: 'Actionable alerts', copy: 'Know what changed nearby before you walk into it.' },
              { icon: MapPinned, title: 'Live local context', copy: 'Map-first awareness for roads, facilities, and hotspots.' },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.12 }}
                className="rounded-3xl border border-border/60 bg-background/70 p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl"
              >
                <item.icon className="size-5 text-emerald-500" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.copy}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative overflow-hidden rounded-[32px] border border-white/30 bg-slate-950 p-4 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(163,230,53,0.18),_transparent_34%)]" />
            <div className="relative rounded-[26px] border border-white/10 bg-slate-900/90 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Crisis Lens live map</p>
                  <h3 className="font-[family:var(--font-display)] text-xl font-semibold text-white">North District</h3>
                </div>
                <Badge className="rounded-full border-0 bg-rose-500/20 px-3 text-rose-100">
                  <span className="mr-2 inline-flex size-2 rounded-full bg-rose-400" />
                  3 active incidents
                </Badge>
              </div>

              <div className="relative mt-6 h-[420px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,23,42,0.82))]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:64px_64px]" />
                <div className="absolute left-10 top-12 h-28 w-28 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="absolute bottom-12 right-12 h-28 w-28 rounded-full bg-lime-400/20 blur-3xl" />
                <div className="absolute inset-y-0 left-[24%] w-px bg-white/10" />
                <div className="absolute inset-x-0 top-[58%] h-px bg-white/10" />
                <div className="absolute left-[20%] top-[18%] h-24 w-[48%] rounded-[999px] border border-emerald-300/20" />
                <div className="absolute left-[38%] top-[26%] h-[48%] w-24 rounded-[999px] border border-lime-300/20" />

                {incidents.map((incident, index) => (
                  <motion.div
                    key={incident.label}
                    className={cn('absolute', incident.position)}
                    animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
                    transition={{ duration: 2.6, delay: index * 0.4, repeat: Infinity }}
                  >
                    <div className="absolute inset-0 rounded-full bg-rose-500/40 blur-xl" />
                    <div className="relative flex h-4 w-4 items-center justify-center rounded-full border border-white/40 bg-rose-500">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    <div className="mt-3 w-36 rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl">
                      <div className="flex items-center gap-2 text-white">
                        <AlertTriangle className="size-4 text-rose-300" />
                        <span className="text-sm font-medium">{incident.label}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">Risk level: {incident.level}</p>
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  animate={{ x: ['-10%', '105%'] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-md"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['Response window', '2m 14s'],
                  ['Trusted reports', '97%'],
                  ['Coverage', '12 monitored zones'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
