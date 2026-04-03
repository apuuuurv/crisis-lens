import { 
  type Incident, 
  type Resource, 
  type IncidentCategory, 
  type IncidentStatus,
  type ResourceType,
  type ResourceStatus
} from "./crisis-data"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface BackendIncident {
  id: number
  title: string
  description: string
  category: string
  severity: number
  latitude: number
  longitude: number
  address: string | null
  status: string
  upvotes: number
  is_verified: boolean
  created_at: string
}

export interface BackendResource {
  id: number
  type: string
  status: string
  latitude: number
  longitude: number
  assigned_incident_id: number | null
}

export interface BackendAlert {
  id: number
  message: string
  is_read: boolean
  created_at: string
}

// Guest Credentials for Auto-Login
const GUEST_CREDENTIALS = {
  name: "Guest User",
  email: "guest@crisis.lens",
  password: "guestPassword123",
  role: "citizen"
}

// Internal Request Wrapper for Auth + Error Handling
async function safeFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers: Record<string, string> = {
    ...Object.fromEntries(Object.entries(options.headers || {}) as [string, string][]),
    "Authorization": token ? `Bearer ${token}` : "",
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error(`API Error [${res.status}]:`, errorData.detail || "Unknown error")
      return { ok: false, status: res.status, data: null }
    }
    const data = await res.json()
    return { ok: true, status: res.status, data }
  } catch (error) {
    console.error("Network Error:", error)
    return { ok: false, status: 0, data: null }
  }
}

export const normalizeIncident = (inc: BackendIncident): Incident => ({
  ...inc,
  id: String(inc.id),
  category: (inc.category.charAt(0).toUpperCase() + inc.category.slice(1)) as IncidentCategory,
  status: (inc.status.charAt(0).toUpperCase() + inc.status.slice(1)) as IncidentStatus,
  timestamp: new Date(inc.created_at),
  location: {
    x: ((inc.longitude + 118.5) / 1) * 100,
    y: 100 - ((inc.latitude - 33.5) / 1) * 100,
  },
  address: inc.address || undefined,
})

export const normalizeResource = (res: BackendResource): Resource => ({
  ...res,
  id: String(res.id),
  type: (res.type) as ResourceType,
  assigned_incident_id: res.assigned_incident_id ? String(res.assigned_incident_id) : null,
  unit_name: `${res.type} ${res.id}`,
  status: (res.status.charAt(0).toUpperCase() + res.status.slice(1)) as ResourceStatus,
})

export const apiClient = {
  initAuth: async () => {
    // 1. Try to login
    const loginData = new URLSearchParams()
    loginData.append("username", GUEST_CREDENTIALS.email)
    loginData.append("password", GUEST_CREDENTIALS.password)

    let res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      body: loginData,
    })

    if (res.status === 401) {
      // 2. If login fails, try to register
      console.log("Guest missing. Registering...")
      await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(GUEST_CREDENTIALS),
      })

      // 3. Try to login again
      res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        body: loginData,
      })
    }

    if (res.ok) {
      const { access_token } = await res.json()
      localStorage.setItem("token", access_token)
      return true
    }
    return false
  },

  getIncidents: async () => {
    const { ok, data } = await safeFetch("/incidents/")
    if (!ok || !Array.isArray(data)) return []
    return data.map(normalizeIncident)
  },

  getResources: async () => {
    const { ok, data } = await safeFetch("/resources/")
    if (!ok || !Array.isArray(data)) return []
    return data.map(normalizeResource)
  },

  reportIncident: async (incident: any) => {
    const { ok, data } = await safeFetch("/incidents/", {
      method: "POST",
      body: JSON.stringify(incident),
    })
    return ok ? normalizeIncident(data) : null
  },

  reportIncidentWithImage: async (formData: FormData) => {
    const { ok, data } = await safeFetch("/incidents/upload", {
      method: "POST",
      body: formData,
    })
    return ok ? normalizeIncident(data) : null
  },

  upvoteIncident: async (incidentId: string) => {
    const { ok, data } = await safeFetch(`/incidents/${incidentId}/upvote`, {
      method: "POST",
    })
    return ok ? normalizeIncident(data) : null
  },

  updateLocation: async (lat: number, lng: number) => {
    await safeFetch("/alerts/my-location", {
      method: "PUT",
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
  },

  getAlerts: async () => {
    const { ok, data } = await safeFetch("/alerts/")
    if (!ok || !Array.isArray(data)) return []
    return data as BackendAlert[]
  },
}
