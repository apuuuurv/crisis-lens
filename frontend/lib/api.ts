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
  trust_status: string
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

// Removed Guest Credentials for Secure Auth

// Internal Request Wrapper for Auth + Error Handling
async function safeFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  
  const headers: Record<string, string> = {
    ...Object.fromEntries(Object.entries(options.headers || {}) as [string, string][]),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData)) {
    if (options.body instanceof URLSearchParams) {
      headers["Content-Type"] = "application/x-www-form-urlencoded"
    } else {
      headers["Content-Type"] = "application/json"
    }
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    
    if (res.status === 401 && typeof window !== "undefined" && !path.includes("/auth/")) {
       // Token expired or invalid, redirect to login
       localStorage.removeItem("token")
       window.location.href = "/login"
       return { ok: false, status: 401, data: null }
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return { ok: false, status: res.status, data: null, error: errorData.detail }
    }
    const data = await res.json()
    return { ok: true, status: res.status, data }
  } catch (error) {
    return { ok: false, status: 503, data: null, error: "Backend Offline" }
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

export interface ReportSubmissionResult {
  incident: Incident
  status: number
}

export const normalizeResource = (res: BackendResource): Resource => ({
  ...res,
  id: String(res.id),
  type: (res.type) as ResourceType,
  assigned_incident_id: res.assigned_incident_id ? String(res.assigned_incident_id) : null,
  unit_name: `${res.type} ${res.id}`,
  status: (res.status.charAt(0).toUpperCase() + res.status.slice(1)) as ResourceStatus,
})

export const apiClient = {
  login: async (email: string, password: string) => {
    const loginData = new URLSearchParams()
    loginData.append("username", email)
    loginData.append("password", password)

    const { ok, data, error } = await safeFetch("/auth/login", {
      method: "POST",
      body: loginData,
    })

    if (ok && data?.access_token) {
      localStorage.setItem("token", data.access_token)
      localStorage.setItem("role", data.role || "citizen")
      return { ok: true, data }
    }
    return { ok: false, error: error || "Login failed" }
  },

  register: async (userData: any) => {
    const { ok, data, error } = await safeFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
    return { ok, data, error }
  },

  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    window.location.href = "/login"
  },

  isAuthenticated: () => {
    if (typeof window === "undefined") return false
    const token = localStorage.getItem("token")
    return !!token && token !== "null" && token !== "undefined"
  },

  getRole: () => {
    if (typeof window === "undefined") return null
    const role = localStorage.getItem("role")
    if (!role || role === "null" || role === "undefined") return null
    return role
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
    const { ok, data, error, status } = await safeFetch("/incidents/", {
      method: "POST",
      body: JSON.stringify(incident),
    })
    if (!ok) throw new Error(error || "Failed to submit report")
    if (!data || typeof data !== "object") throw new Error("Invalid server response")
    return { incident: normalizeIncident(data), status } as ReportSubmissionResult
  },

  reportIncidentWithImage: async (formData: FormData, metadata?: { 
    latitude?: number; 
    longitude?: number; 
    title?: string;
    description?: string;
    category?: string;
    severity?: number;
  }) => {
    if (metadata) {
      if (metadata.latitude) formData.append("latitude", String(metadata.latitude))
      if (metadata.longitude) formData.append("longitude", String(metadata.longitude))
      if (metadata.title) formData.append("title", metadata.title)
      if (metadata.description) formData.append("description", metadata.description)
      if (metadata.category) formData.append("category", metadata.category)
      if (metadata.severity) formData.append("severity", String(metadata.severity))
    }
    const { ok, data, error, status } = await safeFetch("/incidents/upload", {
      method: "POST",
      body: formData,
    })
    if (!ok) throw new Error(error || "Failed to submit report")
    if (!data || typeof data !== "object") throw new Error("Invalid server response")
    return { incident: normalizeIncident(data), status } as ReportSubmissionResult
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
