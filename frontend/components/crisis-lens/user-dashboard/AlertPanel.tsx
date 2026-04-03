'use client'

import { motion } from 'framer-motion'
import { BellRing } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { BackendAlert } from '@/lib/api'

interface AlertPanelProps {
  alerts: Array<BackendAlert & { relativeTime: string }>
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  return (
    <Card className="rounded-[28px] border-white/10 bg-[#050816]/95 text-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-[family:var(--font-display)] text-2xl">Safety alerts</CardTitle>
          <Badge className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-emerald-300">
            {alerts.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-zinc-400">
            No alerts
          </div>
        ) : (
          alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Alert className="rounded-[24px] border-white/10 bg-white/5 text-white">
                <BellRing className="text-emerald-400" />
                <AlertTitle className="text-white">Priority update</AlertTitle>
                <AlertDescription className="text-zinc-300">
                  <p>{alert.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{alert.relativeTime}</p>
                </AlertDescription>
              </Alert>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
