'use client'

import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

interface RiskCardProps {
  level: RiskLevel
  activeCount: number
  summary: string
}

const riskStyles: Record<RiskLevel, { badge: string; ring: string; glow: string }> = {
  LOW: {
    badge: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
    ring: 'from-emerald-500/25 via-emerald-500/5 to-transparent',
    glow: 'shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_30px_90px_-40px_rgba(16,185,129,0.6)]',
  },
  MEDIUM: {
    badge: 'border-amber-500/30 bg-amber-500/15 text-amber-200',
    ring: 'from-amber-500/25 via-amber-500/5 to-transparent',
    glow: 'shadow-[0_0_0_1px_rgba(245,158,11,0.18),0_30px_90px_-40px_rgba(245,158,11,0.6)]',
  },
  HIGH: {
    badge: 'border-red-500/30 bg-red-500/15 text-red-200',
    ring: 'from-red-500/25 via-red-500/5 to-transparent',
    glow: 'shadow-[0_0_0_1px_rgba(239,68,68,0.18),0_30px_90px_-40px_rgba(239,68,68,0.65)]',
  },
}

export function RiskCard({ level, activeCount, summary }: RiskCardProps) {
  const style = riskStyles[level]

  return (
    <Card className={`relative overflow-hidden rounded-[28px] border-white/10 bg-[#050816]/95 text-white ${style.glow}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${style.ring}`} />
      {level === 'HIGH' ? (
        <motion.div
          className="absolute inset-0 rounded-[28px] border border-red-500/30"
          animate={{ opacity: [0.35, 0.8, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : null}
      <CardContent className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <ShieldAlert className="size-6" />
              </div>
              <Badge className={`rounded-full border px-4 py-1 text-xs tracking-[0.2em] ${style.badge}`}>
                {level} RISK
              </Badge>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Current area status</p>
              <h2 className="mt-3 font-[family:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
                {level === 'LOW' && 'Conditions look stable'}
                {level === 'MEDIUM' && 'Stay alert nearby'}
                {level === 'HIGH' && 'Elevated risk detected'}
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">{summary}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[280px]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Active incidents</p>
              <p className="mt-2 text-3xl font-semibold text-white">{activeCount}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recommended action</p>
              <p className="mt-2 text-sm font-medium text-zinc-200">
                {level === 'HIGH' ? 'Avoid affected zones and follow alerts.' : 'Keep notifications on for live updates.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
