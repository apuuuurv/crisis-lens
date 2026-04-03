export type IncidentCategory = "Fire" | "Flood" | "Earthquake" | "Storm" | "Chemical" | "Medical" | "Accident" | "Infrastructure" | "Other"
export type IncidentStatus = "Reported" | "Verifying" | "Active" | "Resolved"
export type IncidentTrustStatus = "Trusted" | "Suspicious" | "Under Review"
export type ResourceType = "Ambulance" | "Fire Truck" | "Police" | "Rescue" | "Helicopter"
export type ResourceStatus = "Available" | "Dispatched" | "Returning"

export interface Incident {
  id: string
  title: string
  description: string
  category: IncidentCategory
  severity?: number
  report_count: number
  status: IncidentStatus
  trust_status?: IncidentTrustStatus
  upvotes: number
  is_verified: boolean
  location: { x: number; y: number }
  timestamp: Date
  latitude?: number
  longitude?: number
  address?: string
}

export interface Resource {
  id: string
  type: ResourceType
  status: ResourceStatus
  assigned_incident_id: string | null
  unit_name: string
  latitude?: number
  longitude?: number
}

export interface Alert {
  id: string
  message: string
  is_read: boolean
  category: IncidentCategory
  timestamp: Date
}

export const mockIncidents: Incident[] = [
  {
    id: "INC-001",
    title: "Warehouse Fire - Industrial District",
    description: "Large fire reported at the abandoned warehouse on 5th and Main. Multiple witnesses confirm heavy smoke.",
    category: "Fire",
    report_count: 15,
    status: "Active",
    trust_status: "Trusted",
    upvotes: 24,
    is_verified: true,
    location: { x: 35, y: 40 },
    timestamp: new Date(Date.now() - 15 * 60000),
  },
  {
    id: "INC-002",
    title: "Flash Flooding - Riverside Area",
    description: "Water levels rising rapidly near the riverbank. Several vehicles stranded.",
    category: "Flood",
    report_count: 8,
    status: "Active",
    trust_status: "Trusted",
    upvotes: 18,
    is_verified: true,
    location: { x: 65, y: 55 },
    timestamp: new Date(Date.now() - 30 * 60000),
  },
  {
    id: "INC-003",
    title: "Gas Leak - Downtown",
    description: "Strong gas smell reported near the shopping center. Area being evacuated.",
    category: "Chemical",
    report_count: 3,
    status: "Verifying",
    trust_status: "Under Review",
    upvotes: 12,
    is_verified: false,
    location: { x: 50, y: 30 },
    timestamp: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "INC-004",
    title: "Multi-Vehicle Accident - Highway 101",
    description: "Major collision involving 4 vehicles. Multiple injuries reported.",
    category: "Medical",
    report_count: 5,
    status: "Active",
    trust_status: "Trusted",
    upvotes: 31,
    is_verified: true,
    location: { x: 75, y: 25 },
    timestamp: new Date(Date.now() - 45 * 60000),
  },
  {
    id: "INC-005",
    title: "Building Collapse - Construction Site",
    description: "Partial structure collapse at new development. Workers may be trapped.",
    category: "Earthquake",
    report_count: 12,
    status: "Active",
    trust_status: "Trusted",
    upvotes: 45,
    is_verified: true,
    location: { x: 25, y: 60 },
    timestamp: new Date(Date.now() - 10 * 60000),
  },
  {
    id: "INC-006",
    title: "Power Lines Down - Suburban Area",
    description: "Storm damage has downed power lines. Risk of electrical hazard.",
    category: "Storm",
    report_count: 4,
    status: "Reported",
    trust_status: "Trusted",
    upvotes: 8,
    is_verified: false,
    location: { x: 80, y: 70 },
    timestamp: new Date(Date.now() - 60 * 60000),
  },
]

export const mockResources: Resource[] = [
  { id: "RES-001", type: "Fire Truck", status: "Dispatched", assigned_incident_id: "INC-001", unit_name: "Engine 7" },
  { id: "RES-002", type: "Fire Truck", status: "Dispatched", assigned_incident_id: "INC-001", unit_name: "Ladder 3" },
  { id: "RES-003", type: "Ambulance", status: "Dispatched", assigned_incident_id: "INC-004", unit_name: "Medic 12" },
  { id: "RES-004", type: "Ambulance", status: "Available", assigned_incident_id: null, unit_name: "Medic 8" },
  { id: "RES-005", type: "Police", status: "Dispatched", assigned_incident_id: "INC-003", unit_name: "Unit 45" },
  { id: "RES-006", type: "Rescue", status: "Dispatched", assigned_incident_id: "INC-005", unit_name: "USAR Team 1" },
  { id: "RES-007", type: "Helicopter", status: "Returning", assigned_incident_id: null, unit_name: "Air 1" },
  { id: "RES-008", type: "Fire Truck", status: "Available", assigned_incident_id: null, unit_name: "Engine 12" },
  { id: "RES-009", type: "Ambulance", status: "Available", assigned_incident_id: null, unit_name: "Medic 15" },
  { id: "RES-010", type: "Police", status: "Available", assigned_incident_id: null, unit_name: "Unit 22" },
]

export const mockAlerts: Alert[] = [
  {
    id: "ALT-001",
    message: "Critical: Building Collapse reported in your sector",
    is_read: false,
    category: "Earthquake",
    timestamp: new Date(Date.now() - 10 * 60000),
  },
  {
    id: "ALT-002",
    message: "Warning: Flash flood warning extended to downtown area",
    is_read: true,
    category: "Flood",
    timestamp: new Date(Date.now() - 35 * 60000),
  },
]

export const categoryColors: Record<IncidentCategory, string> = {
  Fire: "bg-rose/20 text-rose border-rose/30",
  Flood: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Earthquake: "bg-amber/20 text-amber border-amber/30",
  Storm: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Chemical: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Medical: "bg-emerald/20 text-emerald border-emerald/30",
  Accident: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Infrastructure: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  Other: "bg-muted text-muted-foreground border-border",
}

export const statusColors: Record<IncidentStatus, string> = {
  Reported: "bg-muted text-muted-foreground",
  Verifying: "bg-amber/20 text-amber",
  Active: "bg-rose/20 text-rose",
  Resolved: "bg-emerald/20 text-emerald",
}

export const resourceTypeIcons: Record<ResourceType, string> = {
  Ambulance: "🚑",
  "Fire Truck": "🚒",
  Police: "🚔",
  Rescue: "🛟",
  Helicopter: "🚁",
}

export function getHeatColor(count: number): string {
  if (count >= 10) return "bg-rose"
  if (count >= 5) return "bg-amber"
  return "bg-emerald"
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}
