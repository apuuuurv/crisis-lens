'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Flame, HeartPulse, ShieldAlert, Waves, Wind } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Incident } from '@/lib/crisis-data'
import { statusColors } from '@/lib/crisis-data'

interface IncidentListProps {
  incidents: Array<Incident & { distanceKm?: number | null; distanceLabel: string; relativeTime: string }>
  title?: string
  description?: string
  emptyMessage?: string
}

const severityTone = {
  low: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  medium: 'border-amber-500/30 bg-amber-500/15 text-amber-200',
  high: 'border-red-500/30 bg-red-500/15 text-red-200',
}

function getIncidentIcon(category: Incident['category']) {
  switch (category) {
    case 'Fire':
      return Flame
    case 'Flood':
      return Waves
    case 'Storm':
      return Wind
    case 'Medical':
      return HeartPulse
    case 'Chemical':
      return AlertTriangle
    default:
      return ShieldAlert
  }
}

function getSeverityLevel(incident: Incident) {
  const score = incident.severity ?? incident.report_count
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

export function IncidentList({
  incidents,
  title = 'Nearby incidents',
  description = 'Live events within 10 km of your location with time and distance context.',
  emptyMessage = 'No incidents found within 10 km',
}: IncidentListProps) {
  return (
    <Card className="rounded-[28px] border-glass-border bg-glass text-foreground shadow-[0_30px_90px_-50px_rgba(16,185,129,0.35)]">
      <CardHeader className="pb-2">
        <CardTitle className="font-[family:var(--font-display)] text-2xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ScrollArea className="h-[360px] pr-3">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } },
              }}
              className="space-y-3"
            >
              {incidents.map((incident) => {
                const Icon = getIncidentIcon(incident.category)
                const severity = getSeverityLevel(incident)

                return (
                  <motion.div
                    key={incident.id}
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="rounded-[24px] border border-border bg-card/80 p-4 transition-colors hover:bg-accent/70"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-foreground">{incident.title || incident.category}</p>
                          <Badge variant="secondary" className={`rounded-full border px-3 py-1 ${statusColors[incident.status]}`}>
                            {incident.status}
                          </Badge>
                          <Badge className={`rounded-full border px-3 py-1 ${severityTone[severity]}`}>
                            {severity.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span>{incident.relativeTime}</span>
                          <span>{incident.distanceLabel}</span>
                          <span>{incident.category}</span>
                          <span>{incident.report_count} reports</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
