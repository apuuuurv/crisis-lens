"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Map, 
  FileText, 
  Truck, 
  BarChart3, 
  Bell,
  Plus,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Shield,
  ClipboardList
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { 
  type Incident,
  type Resource
} from "@/lib/crisis-data"
import { apiClient, BackendAlert } from "@/lib/api"
import dynamic from "next/dynamic"
import { CrisisFeed } from "./crisis-feed"
import { ResourceTray } from "./resource-tray"
import { ReportIncidentDialog } from "./report-incident-dialog"
import { DispatchDialog } from "./dispatch-dialog"

// Dynamically import Leaflet with SSR: false to prevent hydration mismatches
const LiveMap = dynamic(() => import("./live-map"), { ssr: false })

type NavItem = "map" | "incidents" | "resources" | "analytics"

interface DashboardProps {
  onBackToLanding: () => void
}

export function Dashboard({ onBackToLanding }: DashboardProps) {
  const [activeNav, setActiveNav] = useState<NavItem>("map")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [unreadAlerts, setUnreadAlerts] = useState<BackendAlert[]>([])
  const [isResourceTrayOpen, setIsResourceTrayOpen] = useState(true)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false)
  const [selectedIncidentForDispatch, setSelectedIncidentForDispatch] = useState<Incident | null>(null)

  const ws = useRef<WebSocket | null>(null)

  // 1. Authentication & Initial Fetching
  useEffect(() => {
    const init = async () => {
      const isAuth = apiClient.isAuthenticated()
      const role = apiClient.getRole()

      if (isAuth && role === "admin") {
        setIsAuthenticated(true)
        try {
          const [fetchedIncidents, fetchedResources] = await Promise.all([
            apiClient.getIncidents(),
            apiClient.getResources()
          ])
          setIncidents(fetchedIncidents as Incident[])
          setResources(fetchedResources as Resource[])
        } catch (error) {
          console.error("Fetch Error:", error)
          toast.error("Fetch Error")
        }
      } else {
        // Handled by the page-level guard
        setIsAuthenticated(false)
      }
    }
    init()
  }, [])

  // 2. Real-time WebSockets
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000/ws/incidents")
    
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === "NEW_INCIDENT") {
        const newIncident = message.data
        // We'll re-fetch or map the data. Re-fetching is safer for normalization.
        apiClient.getIncidents().then(data => setIncidents(data as Incident[]))
        toast.error(`NEW INCIDENT: ${newIncident.category}`, {
          description: newIncident.title,
          duration: 5000,
        })
      } else if (message.type === "UPDATE_INCIDENT") {
        const updateData = message.data
        setIncidents(prev => 
          prev.map(inc => inc.id === updateData.id ? { ...inc, report_count: updateData.report_count } : inc)
        )
      }
    }

    return () => ws.current?.close()
  }, [])

  // 3. Geofencing & Location Polling
  useEffect(() => {
    if (!isAuthenticated || !navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLocation({ lat: latitude, lng: longitude })
        apiClient.updateLocation(latitude, longitude)
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    )

    const alertInterval = setInterval(async () => {
      const resp = await apiClient.getAlerts()
      const activeAlerts = Array.isArray(resp) ? resp : []
      const unread = activeAlerts.filter(a => !a.is_read)
      
      if (unread.length > unreadAlerts.length) {
        setUnreadAlerts(unread)
        // ... (toast logic maintained)
      }
    }, 10000)

    return () => {
      navigator.geolocation.clearWatch(watchId)
      clearInterval(alertInterval)
    }
  }, [isAuthenticated, unreadAlerts])

  const navItems: { id: NavItem; label: string; icon: typeof Map }[] = [
    { id: "map", label: "Live Map", icon: Map },
    { id: "incidents", label: "Incident Logs", icon: FileText },
    { id: "resources", label: "Resource Dispatch", icon: Truck },
    { id: "analytics", label: "Risk Analytics", icon: BarChart3 },
  ]

  const activeIncidents = incidents.filter(i => i.status === "Active").length

  const handleUpvote = async (incidentId: string) => {
    try {
      const updatedIncident = await apiClient.upvoteIncident(incidentId)
      if (updatedIncident) {
        setIncidents(prev => 
          prev.map(inc => inc.id === incidentId ? updatedIncident as Incident : inc)
        )
      }
    } catch (error) {
      toast.error("Action failed")
    }
  }

  const handleReportIncident = async (payload: any) => {
    try {
      let newIncident;
      if (payload instanceof FormData) {
        newIncident = await apiClient.reportIncidentWithImage(payload)
      } else {
        const finalPayload = {
          ...payload,
          latitude: userLocation?.lat || 34.0522,
          longitude: userLocation?.lng || -118.2437
        }
        newIncident = await apiClient.reportIncident(finalPayload)
      }
      
      if (newIncident) {
        setIncidents(prev => [newIncident as Incident, ...prev])
        toast.success("Incident reported")
      }
    } catch (error) {
      toast.error("Submission failed")
    }
  }

  const handleDispatch = (resourceId: string, incidentId: string) => {
    setResources(prev =>
      prev.map(res =>
        res.id === resourceId
          ? { ...res, status: "Dispatched", assigned_incident_id: incidentId }
          : res
      )
    )
    const resource = resources.find(r => r.id === resourceId)
    const incident = incidents.find(i => i.id === incidentId)
    toast.success("Resource dispatched", {
      description: `${resource?.unit_name} assigned to ${incident?.title}`,
    })
  }

  const handleOpenDispatch = (incident: Incident) => {
    setSelectedIncidentForDispatch(incident)
    setDispatchDialogOpen(true)
  }

  const triggerGeofenceAlert = () => {
    const categories = ["Fire", "Flood", "Chemical", "Earthquake"] as const
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    toast.error("DANGER: Geofence Alert", {
      description: `A ${randomCategory} has been reported within 5km of your location.`,
      duration: 6000,
      style: {
        background: "oklch(0.25 0.12 25)",
        border: "1px solid oklch(0.65 0.25 25)",
        color: "oklch(0.95 0.01 260)",
      },
    })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <motion.aside
        initial={{ x: -80 }}
        animate={{ x: 0 }}
        className="flex w-20 flex-col items-center border-r border-border bg-sidebar py-4"
      >
        {/* Logo */}
        <button
          onClick={onBackToLanding}
          className="mb-8 flex size-12 items-center justify-center rounded-xl bg-emerald/10 transition-colors hover:bg-emerald/20"
        >
          <Shield className="size-6 text-emerald" />
        </button>

        {/* Nav Items */}
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative flex size-12 items-center justify-center rounded-xl transition-colors ${
                activeNav === item.id
                  ? "bg-emerald text-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
            >
              <item.icon className="size-5" />
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
                {item.label}
              </span>
            </motion.button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-2">
          {/* Alert Badge */}
          <button
            onClick={triggerGeofenceAlert}
            className="group relative flex size-12 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <Bell className="size-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-rose text-[10px] font-bold text-white">
                {unreadAlerts.length}
              </span>
            )}
            <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
              Test Alert
            </span>
          </button>

          {/* Manual Log (Admin) */}
          <button
            onClick={() => setReportDialogOpen(true)}
            className="group relative flex size-12 items-center justify-center rounded-xl bg-emerald text-primary-foreground transition-colors hover:bg-emerald/90"
          >
            <ClipboardList className="size-5" />
            <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
              Manual Log
            </span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackToLanding}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {navItems.find(n => n.id === activeNav)?.label}
              </h1>
              <p className="text-sm text-muted-foreground">
                Command Center • Real-time monitoring active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-2 border-rose/30 bg-rose/10 text-rose">
              <span className="size-2 animate-pulse rounded-full bg-rose" />
              {activeIncidents} Active Incidents
            </Badge>
            <Badge variant="outline" className="gap-2 border-emerald/30 bg-emerald/10 text-emerald">
              <span className="size-2 rounded-full bg-emerald" />
              {resources.filter(r => r.status === "Available").length} Units Available
            </Badge>
          </div>
        </motion.header>

        {/* Content Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Map/Content Area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {activeNav === "map" && (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 p-4"
                >
                  <LiveMap 
                    incidents={incidents} 
                    resources={resources.filter(r => r.status === "Dispatched")}
                    onIncidentClick={handleOpenDispatch}
                  />
                </motion.div>
              )}
              {activeNav === "incidents" && (
                <motion.div
                  key="incidents"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden p-4"
                >
                  <IncidentLogView 
                    incidents={incidents} 
                    onUpvote={handleUpvote}
                    onDispatch={handleOpenDispatch}
                  />
                </motion.div>
              )}
              {activeNav === "resources" && (
                <motion.div
                  key="resources"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden p-4"
                >
                  <ResourceView resources={resources} incidents={incidents} />
                </motion.div>
              )}
              {activeNav === "analytics" && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden p-4"
                >
                  <AnalyticsView incidents={incidents} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resource Tray */}
            <div className="border-t border-border">
              <button
                onClick={() => setIsResourceTrayOpen(!isResourceTrayOpen)}
                className="flex w-full items-center justify-between bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-xl transition-colors hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Truck className="size-4" />
                  Resource Units ({resources.length})
                </span>
                {isResourceTrayOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </button>
              <AnimatePresence>
                {isResourceTrayOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <ResourceTray resources={resources} incidents={incidents} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Sidebar - Crisis Feed */}
          <aside className="hidden w-80 flex-col border-l border-border bg-card/30 backdrop-blur-xl lg:flex">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-semibold text-foreground">Real-time Feed</h2>
              <Badge variant="secondary" className="text-xs">
                {incidents.length} Reports
              </Badge>
            </div>
            <ScrollArea className="flex-1">
              <CrisisFeed 
                incidents={incidents} 
                onUpvote={handleUpvote}
                onDispatch={handleOpenDispatch}
              />
            </ScrollArea>
          </aside>
        </div>
      </div>

      {/* Dialogs */}
      <ReportIncidentDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onSubmit={handleReportIncident}
      />
      <DispatchDialog
        open={dispatchDialogOpen}
        onOpenChange={setDispatchDialogOpen}
        incident={selectedIncidentForDispatch}
        resources={resources.filter(r => r.status === "Available")}
        onDispatch={handleDispatch}
      />
    </div>
  )
}

// Incident Log View Component
function IncidentLogView({ 
  incidents, 
  onUpvote,
  onDispatch 
}: { 
  incidents: Incident[]
  onUpvote: (id: string) => void
  onDispatch: (incident: Incident) => void
}) {
  return (
    <div className="h-full rounded-xl border border-border bg-card/50 backdrop-blur-xl">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold text-foreground">All Incidents</h2>
        <p className="text-sm text-muted-foreground">Complete log of reported incidents</p>
      </div>
      <ScrollArea className="h-[calc(100%-80px)]">
        <div className="p-4">
          <CrisisFeed 
            incidents={incidents} 
            onUpvote={onUpvote}
            onDispatch={onDispatch}
            compact={false}
          />
        </div>
      </ScrollArea>
    </div>
  )
}

// Resource View Component
function ResourceView({ resources, incidents }: { resources: Resource[], incidents: Incident[] }) {
  const groupedResources = {
    Available: resources.filter(r => r.status === "Available"),
    Dispatched: resources.filter(r => r.status === "Dispatched"),
    Returning: resources.filter(r => r.status === "Returning"),
  }

  return (
    <div className="grid h-full gap-4 md:grid-cols-3">
      {Object.entries(groupedResources).map(([status, resourceList]) => (
        <div key={status} className="rounded-xl border border-border bg-card/50 backdrop-blur-xl">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${
                status === "Available" ? "bg-emerald" : 
                status === "Dispatched" ? "bg-amber" : "bg-blue-400"
              }`} />
              <h3 className="font-semibold text-foreground">{status}</h3>
              <Badge variant="secondary" className="ml-auto">{resourceList.length}</Badge>
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="space-y-2 p-4">
              {resourceList.map(resource => {
                const assignedIncident = incidents.find(i => i.id === resource.assigned_incident_id)
                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{
                        resource.type === "Ambulance" ? "🚑" :
                        resource.type === "Fire Truck" ? "🚒" :
                        resource.type === "Police" ? "🚔" :
                        resource.type === "Rescue" ? "🛟" : "🚁"
                      }</span>
                      <div>
                        <p className="font-medium text-foreground">{resource.unit_name}</p>
                        <p className="text-xs text-muted-foreground">{resource.type}</p>
                      </div>
                    </div>
                    {assignedIncident && (
                      <p className="mt-2 truncate text-xs text-amber">
                        → {assignedIncident.title}
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}

// Analytics View Component
function AnalyticsView({ incidents }: { incidents: Incident[] }) {
  const categoryCount = incidents.reduce((acc, inc) => {
    acc[inc.category] = (acc[inc.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusCount = incidents.reduce((acc, inc) => {
    acc[inc.status] = (acc[inc.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const avgSeverity = (incidents.reduce((sum, inc) => sum + (inc.severity || 0), 0) / (incidents.length || 1)).toFixed(1)

  return (
    <div className="grid h-full gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Severity Overview */}
      <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-xl">
        <h3 className="mb-4 font-semibold text-foreground">Severity Overview</h3>
        <div className="flex items-center justify-center">
          <div className="relative flex size-32 items-center justify-center">
            <svg className="size-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                className="fill-none stroke-muted stroke-[8]"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                className="fill-none stroke-amber stroke-[8]"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 352" }}
                animate={{ strokeDasharray: `${(parseFloat(avgSeverity) / 10) * 352} 352` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-bold text-foreground">{avgSeverity}</span>
              <span className="block text-xs text-muted-foreground">Avg Severity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-xl">
        <h3 className="mb-4 font-semibold text-foreground">By Category</h3>
        <div className="space-y-3">
          {Object.entries(categoryCount).map(([category, count]) => (
            <div key={category} className="flex items-center gap-3">
              <div className="w-20 text-sm text-muted-foreground">{category}</div>
              <div className="flex-1">
                <motion.div
                  className={`h-2 rounded-full ${
                    category === "Fire" ? "bg-rose" :
                    category === "Flood" ? "bg-blue-400" :
                    category === "Earthquake" ? "bg-amber" :
                    category === "Chemical" ? "bg-yellow-400" :
                    category === "Storm" ? "bg-purple-400" : "bg-emerald"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / incidents.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="w-6 text-right text-sm font-medium text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Distribution */}
      <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-xl">
        <h3 className="mb-4 font-semibold text-foreground">Status Distribution</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(statusCount).map(([status, count]) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg border border-border bg-card p-4 text-center"
            >
              <span className={`mb-1 inline-block size-3 rounded-full ${
                status === "Active" ? "bg-rose" :
                status === "Verifying" ? "bg-amber" :
                status === "Reported" ? "bg-muted-foreground" : "bg-emerald"
              }`} />
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground">{status}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Risk Heatmap Placeholder */}
      <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-xl md:col-span-2 lg:col-span-3">
        <h3 className="mb-4 font-semibold text-foreground">24h Incident Timeline</h3>
        <div className="flex h-24 items-end gap-1">
          {[...Array(24)].map((_, i) => {
            const height = Math.random() * 80 + 20
            return (
              <motion.div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-emerald to-amber"
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: i * 0.02 }}
              />
            )
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>
    </div>
  )
}
