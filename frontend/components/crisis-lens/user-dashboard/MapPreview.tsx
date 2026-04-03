'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, MapPinned } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Incident } from '@/lib/crisis-data'

interface MapPreviewProps {
  incidents: Incident[]
}

export function MapPreview({ incidents }: MapPreviewProps) {
  const markers = incidents.slice(0, 6)

  return (
    <Card className="rounded-[28px] border-white/10 bg-[#050816]/95 text-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-[family:var(--font-display)] text-2xl">Map snapshot</CardTitle>
          <Button asChild variant="outline" className="rounded-full border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white">
            <Link href="/report">
              Open report map
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[280px] overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,#020617,#03140f,#052e1b)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,197,94,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,197,94,0.12)_1px,transparent_1px)] bg-[size:54px_54px]" />
          <div className="absolute left-[15%] top-[18%] h-[58%] w-[46%] rounded-[999px] border border-emerald-500/15" />
          <div className="absolute left-[48%] top-[24%] h-[42%] w-[24%] rounded-[999px] border border-lime-400/10" />
          {markers.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <MapPinned className="size-8 text-emerald-400" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            markers.map((incident, index) => {
              const x = 18 + (index * 13) % 62
              const y = 20 + (index * 11) % 50

              return (
                <motion.div
                  key={incident.id}
                  className="absolute"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.2 }}
                >
                  <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl" />
                  <div className="relative h-4 w-4 rounded-full bg-emerald-400 ring-8 ring-emerald-500/10" />
                </motion.div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
