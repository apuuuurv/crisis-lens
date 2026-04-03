'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BellRing, Loader2, LogOut, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/landing/ThemeToggle'
import { apiClient, type BackendAlert } from '@/lib/api'
import type { Incident } from '@/lib/crisis-data'
import { AlertPanel } from './AlertPanel'
import { IncidentList } from './IncidentList'
import { MapPreview } from './MapPreview'
import { RiskCard, type RiskLevel } from './RiskCard'
import { TrendingSection } from './TrendingSection'

interface UserDashboardProps {
  onLogout: () => void
}

function formatTimeAgo(date: Date) {
  const diff = Math.max(0, Date.now() - date.getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} mins ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getDistanceKm(user: { lat: number; lng: number } | null, incident: Incident) {
  if (!user || !incident.latitude || !incident.longitude) return null
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadius = 6371
  const dLat = toRad(incident.latitude - user.lat)
  const dLng = toRad(incident.longitude - user.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(user.lat)) *
      Math.cos(toRad(incident.latitude)) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}

function getRiskLevel(incidents: Incident[]): RiskLevel {
  const active = incidents.filter((incident) => incident.status === 'Active')
  const maxSeverity = Math.max(0, ...active.map((incident) => incident.severity ?? incident.report_count))
  if (active.length >= 3 || maxSeverity >= 7) return 'HIGH'
  if (active.length >= 1 || maxSeverity >= 4) return 'MEDIUM'
  return 'LOW'
}

export function UserDashboard({ onLogout }: UserDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [alerts, setAlerts] = useState<BackendAlert[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setUserLocation({ lat: coords.latitude, lng: coords.longitude }),
        () => setUserLocation(null),
      )
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const [incidentData, alertData] = await Promise.all([
          apiClient.getIncidents(),
          apiClient.getAlerts(),
        ])

        if (!active) return

        setIncidents(Array.isArray(incidentData) ? incidentData : [])
        setAlerts(Array.isArray(alertData) ? alertData : [])
      } catch {
        if (!active) return
        setError('Unable to load live incident awareness right now.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    const interval = window.setInterval(loadDashboard, 15000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  const enrichedIncidents = useMemo(() => {
    return [...incidents]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map((incident) => {
        const distance = getDistanceKm(userLocation, incident)
        return {
          ...incident,
          distanceLabel: distance == null ? 'Distance unavailable' : `${distance.toFixed(1)} km away`,
          relativeTime: formatTimeAgo(incident.timestamp),
        }
      })
  }, [incidents, userLocation])

  const enrichedAlerts = useMemo(
    () =>
      alerts.map((alert) => ({
        ...alert,
        relativeTime: formatTimeAgo(new Date(alert.created_at)),
      })),
    [alerts],
  )

  const trending = useMemo(() => {
    const counts = incidents.reduce<Record<string, number>>((acc, incident) => {
      acc[incident.category] = (acc[incident.category] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))
  }, [incidents])

  const riskLevel = useMemo(() => getRiskLevel(incidents), [incidents])
  const activeCount = incidents.filter((incident) => incident.status === 'Active').length

  const summary =
    riskLevel === 'HIGH'
      ? 'Multiple verified incidents are active near monitored zones. Check alerts before heading out.'
      : riskLevel === 'MEDIUM'
        ? 'Some activity has been detected nearby. Stay aware and keep live alerts enabled.'
        : 'No major verified incidents are currently affecting your area. Continue monitoring for updates.'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_28%),linear-gradient(180deg,#010409,#050816_45%,#02050d)] text-white">
      <div className="mx-auto w-[min(1280px,calc(100%-1.5rem))] py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 rounded-[30px] border border-white/10 bg-black/50 px-5 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Crisis Lens</p>
              <h1 className="font-[family:var(--font-display)] text-3xl font-semibold tracking-tight">Incident Awareness Dashboard</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-zinc-200">
              <BellRing className="mr-2 size-4 text-emerald-400" />
              {alerts.filter((alert) => !alert.is_read).length} unread alerts
            </Badge>
            <ThemeToggle />
            <Button asChild variant="outline" className="rounded-full border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white">
              <Link href="/report">Report incident</Link>
            </Button>
            <Button variant="ghost" className="rounded-full text-zinc-300 hover:bg-white/5 hover:text-white" onClick={onLogout}>
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid gap-5">
            <Skeleton className="h-[220px] rounded-[28px] bg-white/5" />
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <Skeleton className="h-[420px] rounded-[28px] bg-white/5" />
              <Skeleton className="h-[420px] rounded-[28px] bg-white/5" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <Skeleton className="h-[320px] rounded-[28px] bg-white/5" />
              <Skeleton className="h-[220px] rounded-[28px] bg-white/5" />
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-red-500/20 bg-red-500/10 px-6 text-center">
            <TriangleAlert className="size-10 text-red-300" />
            <p className="mt-4 max-w-md text-base text-red-100">{error}</p>
          </div>
        ) : (
          <div className="grid gap-5">
            <RiskCard level={riskLevel} activeCount={activeCount} summary={summary} />

            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <IncidentList incidents={enrichedIncidents} />
              <AlertPanel alerts={enrichedAlerts} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <MapPreview incidents={incidents} />
              <TrendingSection items={trending} />
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Button
            asChild
            size="icon"
            className="h-14 w-14 rounded-full bg-emerald-500 text-black shadow-[0_24px_70px_-30px_rgba(34,197,94,0.85)] hover:bg-emerald-400"
          >
            <Link href="/report" aria-label="Report incident">
              +
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
