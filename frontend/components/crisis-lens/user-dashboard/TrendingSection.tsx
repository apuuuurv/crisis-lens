'use client'

import { motion } from 'framer-motion'
import { Flame, HeartPulse, ShieldAlert, Waves, Wind } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TrendingItem {
  type: string
  count: number
}

interface TrendingSectionProps {
  items: TrendingItem[]
}

function getIcon(type: string) {
  switch (type) {
    case 'Fire':
      return Flame
    case 'Flood':
      return Waves
    case 'Storm':
      return Wind
    case 'Medical':
      return HeartPulse
    default:
      return ShieldAlert
  }
}

export function TrendingSection({ items }: TrendingSectionProps) {
  return (
    <Card className="rounded-[28px] border-glass-border bg-glass text-foreground">
      <CardHeader className="pb-2">
        <CardTitle className="font-[family:var(--font-display)] text-2xl">Trending incident types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
              No recent activity
            </div>
          ) : (
            items.map((item, index) => {
              const Icon = getIcon(item.type)

              return (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="min-w-[170px] rounded-[24px] border border-border bg-card/80 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-4 font-semibold text-foreground">{item.type}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.count} active or recent reports</p>
                </motion.div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
