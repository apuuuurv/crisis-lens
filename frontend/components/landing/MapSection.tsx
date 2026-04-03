'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

const markers = [
  { label: 'North Gate', x: 'left-[16%]', y: 'top-[22%]', tone: 'bg-emerald-400' },
  { label: 'Main Hall', x: 'left-[38%]', y: 'top-[44%]', tone: 'bg-rose-400' },
  { label: 'Science Block', x: 'left-[58%]', y: 'top-[28%]', tone: 'bg-amber-400' },
  { label: 'Dorm District', x: 'left-[74%]', y: 'top-[64%]', tone: 'bg-teal-400' },
]

export function MapSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-[min(1240px,calc(100%-1rem))] overflow-hidden rounded-[40px] border border-white/10 bg-slate-950 text-white shadow-[0_40px_120px_-50px_rgba(15,23,42,0.9)]">
        <div className="grid gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-14 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65 }}
            className="flex flex-col justify-center"
          >
            <Badge className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1 text-emerald-200">
              Live map layer
            </Badge>
            <h2 className="mt-5 font-[family:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
              See what&apos;s happening in real time
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
              A map-first interface helps users understand where disruptions are happening, how intense they are, and which areas are safe to cross.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ['Heatmap signal', 'Visual density from community and verified reports'],
                ['Instant route awareness', 'Understand closures and active disruptions before moving'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7 }}
            className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:60px_60px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_24%,rgba(45,212,191,0.18),transparent_24%),radial-gradient(circle_at_70%_68%,rgba(59,130,246,0.18),transparent_28%)]" />
            <div className="absolute left-[12%] top-[14%] h-[72%] w-[58%] rounded-[999px] border border-emerald-400/20" />
            <div className="absolute left-[50%] top-[18%] h-[56%] w-[28%] rounded-[999px] border border-teal-400/20" />
            <div className="absolute left-[24%] top-[54%] h-[18%] w-[42%] rounded-[999px] border border-amber-300/20" />

            <div className="absolute inset-x-0 top-[48%] h-px bg-white/10" />
            <div className="absolute inset-y-0 left-[28%] w-px bg-white/10" />
            <div className="absolute inset-y-0 left-[66%] w-px bg-white/10" />

            {markers.map((marker, index) => (
              <motion.div
                key={marker.label}
                className={`absolute ${marker.x} ${marker.y}`}
                animate={{ scale: [1, 1.1, 1], opacity: [0.92, 1, 0.92] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: index * 0.35 }}
              >
                <div className={`absolute inset-0 rounded-full ${marker.tone}/40 blur-xl`} />
                <div className={`relative h-4 w-4 rounded-full ${marker.tone} ring-8 ring-white/5`} />
                <div className="mt-3 rounded-full border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-slate-200 shadow-xl">
                  {marker.label}
                </div>
              </motion.div>
            ))}

            <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-white/10 bg-slate-900/80 p-4 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Zone overview</p>
                  <p className="mt-2 text-lg font-semibold text-white">4 hotspots monitored in the last 15 minutes</p>
                </div>
                <div className="flex gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-white/10 px-3 py-1">Verified reports</span>
                  <span className="rounded-full border border-white/10 px-3 py-1">Automated signals</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
