'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BellRing, Loader2, LogOut, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/landing/ThemeToggle'
import { apiClient, type BackendAlert, type PendingResolutionRequest } from '@/lib/api'
import type { Incident } from '@/lib/crisis-data'
import { AlertPanel } from './AlertPanel'
import { IncidentList } from './IncidentList'
import { MapPreview } from './MapPreview'
import { RiskCard, type RiskLevel } from './RiskCard'
import { ResolutionRequestsPanel } from './ResolutionRequestsPanel'
import { TrendingSection } from './TrendingSection'

interface UserDashboardProps {
  onLogout: () => void
}

function mergeIncidents(primary: Incident[], fallback: Incident[]) {
  const merged = new Map<string, Incident>()

  for (const incident of fallback) {
    merged.set(incident.id, incident)
  }

  for (const incident of primary) {
    merged.set(incident.id, incident)
  }

  return Array.from(merged.values())
}

function readRecentReportedIncident() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('recent_reported_incident')
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Incident & { timestamp?: string | Date }
    if (!parsed?.id) return null

    return {
      ...parsed,
      timestamp: parsed.timestamp instanceof Date ? parsed.timestamp : new Date(parsed.timestamp ?? Date.now()),
    } as Incident
  } catch {
    return null
  }
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
  const [myReportedIncidents, setMyReportedIncidents] = useState<Incident[]>([])
  const [alerts, setAlerts] = useState<BackendAlert[]>([])
  const [pendingResolutionRequests, setPendingResolutionRequests] = useState<PendingResolutionRequest[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const hasLoadedOnce = useRef(false)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const readRecentReportLocation = () => {
      if (typeof window === 'undefined') return null
      const raw = localStorage.getItem('recent_report_location')
      if (!raw) return null

      try {
        const parsed = JSON.parse(raw) as { lat?: number; lng?: number; savedAt?: number }
        if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') {
          return null
        }
        return { lat: parsed.lat, lng: parsed.lng }
      } catch {
        return null
      }
    }

    const fallbackLocation = readRecentReportLocation()
    if (fallbackLocation) {
      setUserLocation(fallbackLocation)
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setUserLocation({ lat: coords.latitude, lng: coords.longitude }),
        () => {
          if (!fallbackLocation) {
            setUserLocation(null)
          }
        },
      )
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      try {
        if (!hasLoadedOnce.current) {
          setLoading(true)
        }
        setError(null)
        const recentReportedIncident = readRecentReportedIncident()
        const [incidentData, myReportData, alertData, pendingRequests, currentUser] = await Promise.all([
          apiClient.getIncidents({ includeResolved: true }),
          apiClient.getMyReportedIncidents({ includeResolved: true }),
          apiClient.getAlerts(),
          apiClient.getPendingResolutionRequests(),
          apiClient.getMe(),
        ])

        if (!active) return

        const normalizedIncidents = Array.isArray(incidentData) ? incidentData : []
        const normalizedMyReports = Array.isArray(myReportData) ? myReportData : []

        setIncidents(recentReportedIncident ? mergeIncidents(normalizedIncidents, [recentReportedIncident]) : normalizedIncidents)
        setMyReportedIncidents(
          recentReportedIncident ? mergeIncidents(normalizedMyReports, [recentReportedIncident]) : normalizedMyReports,
        )
        setAlerts(Array.isArray(alertData) ? alertData : [])
        setPendingResolutionRequests(Array.isArray(pendingRequests) ? pendingRequests : [])
        setCurrentUserId(currentUser?.id ?? null)
        hasLoadedOnce.current = true
      } catch {
        if (!active) return
        setError('Unable to load live incident awareness right now.')
      } finally {
        if (active && !hasLoadedOnce.current) {
          setLoading(false)
        } else if (active) {
          setLoading(false)
        }
      }
    }

    loadDashboard()
    const interval = window.setInterval(loadDashboard, 15000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const syncIncidents = async () => {
      try {
        const recentReportedIncident = readRecentReportedIncident()
        const [incidentData, myReportData, pendingRequests] = await Promise.all([
          apiClient.getIncidents({ includeResolved: true }),
          apiClient.getMyReportedIncidents({ includeResolved: true }),
          apiClient.getPendingResolutionRequests(),
        ])
        const normalizedIncidents = Array.isArray(incidentData) ? incidentData : []
        const normalizedMyReports = Array.isArray(myReportData) ? myReportData : []

        setIncidents(recentReportedIncident ? mergeIncidents(normalizedIncidents, [recentReportedIncident]) : normalizedIncidents)
        setMyReportedIncidents(
          recentReportedIncident ? mergeIncidents(normalizedMyReports, [recentReportedIncident]) : normalizedMyReports,
        )
        setPendingResolutionRequests(Array.isArray(pendingRequests) ? pendingRequests : [])
      } catch {
        // Keep silent here so background sync doesn't spam users.
      }
    }

    ws.current = new WebSocket("ws://127.0.0.1:8000/ws/incidents")
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (
        message.type === 'NEW_INCIDENT' ||
        message.type === 'UPDATE_INCIDENT' ||
        message.type === 'RESOLUTION_REQUESTED' ||
        message.type === 'RESOLUTION_RESPONSE'
      ) {
        syncIncidents()
      }
    }

    return () => {
      ws.current?.close()
    }
  }, [])

  const enrichedIncidents = useMemo(() => {
    return [...incidents]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map((incident) => {
        const distance = getDistanceKm(userLocation, incident)
        return {
          ...incident,
          distanceKm: distance,
          distanceLabel: distance == null ? 'Distance unavailable' : `${distance.toFixed(1)} km away`,
          relativeTime: formatTimeAgo(incident.timestamp),
        }
      })
  }, [incidents, userLocation])

  const nearbyIncidents = useMemo(
    () =>
      enrichedIncidents.filter(
        (incident) => incident.status !== 'Resolved' && incident.distanceKm != null && incident.distanceKm <= 10,
      ),
    [enrichedIncidents],
  )

  const nearbyResolvedIncidents = useMemo(
    () =>
      enrichedIncidents.filter(
        (incident) => incident.status === 'Resolved' && incident.distanceKm != null && incident.distanceKm <= 10,
      ),
    [enrichedIncidents],
  )

  const enrichedMyReportedIncidents = useMemo(() => {
    return [...myReportedIncidents]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map((incident) => {
        const distance = getDistanceKm(userLocation, incident)
        return {
          ...incident,
          distanceKm: distance,
          distanceLabel: distance == null ? 'Distance unavailable' : `${distance.toFixed(1)} km away`,
          relativeTime: formatTimeAgo(incident.timestamp),
        }
      })
  }, [myReportedIncidents, userLocation])

  const enrichedAlerts = useMemo(
    () =>
      alerts.map((alert) => ({
        ...alert,
        relativeTime: formatTimeAgo(new Date(alert.created_at)),
      })),
    [alerts],
  )

  const visibleIncidents = useMemo(
    () => incidents.filter((incident) => incident.status !== 'Resolved'),
    [incidents],
  )

  const enrichedResolutionRequests = useMemo(
    () =>
      pendingResolutionRequests.map((request) => ({
        ...request,
        relativeTime: formatTimeAgo(request.requested_at),
      })),
    [pendingResolutionRequests],
  )

  const trending = useMemo(() => {
    const counts = visibleIncidents.reduce<Record<string, number>>((acc, incident) => {
      acc[incident.category] = (acc[incident.category] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))
  }, [visibleIncidents])

  const riskLevel = useMemo(() => getRiskLevel(visibleIncidents), [visibleIncidents])
  const activeCount = visibleIncidents.length

  const summary =
    riskLevel === 'HIGH'
      ? 'Multiple verified incidents are active near monitored zones. Check alerts before heading out.'
      : riskLevel === 'MEDIUM'
        ? 'Some activity has been detected nearby. Stay aware and keep live alerts enabled.'
        : 'No major verified incidents are currently affecting your area. Continue monitoring for updates.'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_28%),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--background)_82%,black_18%)_45%,var(--background))] text-foreground transition-colors">
      <div className="mx-auto w-[min(1280px,calc(100%-1.5rem))] py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 rounded-[30px] border border-glass-border bg-glass px-5 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between"
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
            <Badge className="rounded-full border border-border bg-card/70 px-4 py-2 text-foreground">
              <BellRing className="mr-2 size-4 text-emerald-400" />
              {alerts.filter((alert) => !alert.is_read).length} unread alerts
            </Badge>
            <ThemeToggle />
            <Button asChild variant="outline" className="rounded-full border-border bg-card/70 text-foreground hover:bg-accent hover:text-accent-foreground">
              <Link href="/report">Report incident</Link>
            </Button>
            <Button variant="ghost" className="rounded-full text-muted-foreground hover:bg-accent hover:text-foreground" onClick={onLogout}>
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid gap-5">
            <Skeleton className="h-[220px] rounded-[28px] bg-card/70" />
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <Skeleton className="h-[420px] rounded-[28px] bg-card/70" />
              <Skeleton className="h-[420px] rounded-[28px] bg-card/70" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <Skeleton className="h-[320px] rounded-[28px] bg-card/70" />
              <Skeleton className="h-[220px] rounded-[28px] bg-card/70" />
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

            <ResolutionRequestsPanel
              requests={enrichedResolutionRequests}
              onRespond={async (requestId, payload) => {
                await apiClient.respondToResolutionRequest(requestId, payload)
                const [incidentData, myReportData, pendingRequests] = await Promise.all([
                  apiClient.getIncidents({ includeResolved: true }),
                  apiClient.getMyReportedIncidents({ includeResolved: true }),
                  apiClient.getPendingResolutionRequests(),
                ])
                setIncidents(Array.isArray(incidentData) ? incidentData : [])
                setMyReportedIncidents(Array.isArray(myReportData) ? myReportData : [])
                setPendingResolutionRequests(Array.isArray(pendingRequests) ? pendingRequests : [])
              }}
            />

            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <IncidentList incidents={nearbyIncidents} />
              <AlertPanel alerts={enrichedAlerts} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <IncidentList
                incidents={enrichedMyReportedIncidents}
                title="My reported issues"
                description="Issues you reported, including their current reported or resolved status."
                emptyMessage="You have not reported any incidents yet"
              />
              <IncidentList
                incidents={nearbyResolvedIncidents}
                title="Nearby resolved issues"
                description="Resolved incidents within 10 km of your location so you can track local recovery."
                emptyMessage="No nearby resolved incidents within 10 km"
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <MapPreview incidents={visibleIncidents} />
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
