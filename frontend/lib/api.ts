import { 
  type Incident, 
  type Resource, 
  type IncidentCategory, 
  type IncidentStatus,
  type ResourceType,
  type ResourceStatus
} from "./crisis-data"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function extractImageFilename(description: string) {
  const match = description.match(/File:\s*([^\s]+)$/i)
  return match?.[1] ?? null
}

export interface BackendIncident {
  id: number
  title: string
  description: string
  category: string
  severity: number
  report_count?: number
  latitude: number
  longitude: number
  address: string | null
  status: string
  trust_status: string
  reported_by: number
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

export interface BackendIncidentReportDetail {
  id: number
  user_id: number
  user_name: string
  user_email: string
  created_at: string
  latitude: number
  longitude: number
  image_filename?: string | null
}

export interface BackendIncidentReportHistory {
  incident_id: number
  incident_title: string
  reports: BackendIncidentReportDetail[]
}

export interface BackendUser {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

export interface IncidentReportDetail {
  id: string
  user_id: number
  user_name: string
  user_email: string
  created_at: Date
  latitude: number
  longitude: number
  image_filename?: string
  image_url?: string
}

export interface PendingResolutionRequest {
  request_id: string
  incident_id: string
  incident_title: string
  category: string
  requested_at: Date
  requested_by_admin_name: string
  requested_by_admin_email: string
}

export interface AdminResolutionFeedback {
  request_id: string
  incident_id: string
  incident_title: string
  category: string
  user_name: string
  user_email: string
  status: string
  response_message?: string
  created_at: Date
  responded_at?: Date
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
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers, cache: "no-store" })
    
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

export const normalizeIncident = (inc: BackendIncident): Incident => {
  const imageFilename = extractImageFilename(inc.description)

  return {
    ...inc,
    id: String(inc.id),
    category: (inc.category.charAt(0).toUpperCase() + inc.category.slice(1)) as IncidentCategory,
    status: (inc.status.charAt(0).toUpperCase() + inc.status.slice(1)) as IncidentStatus,
    report_count: inc.report_count ?? 1,
    timestamp: new Date(inc.created_at),
    location: {
      x: ((inc.longitude + 118.5) / 1) * 100,
      y: 100 - ((inc.latitude - 33.5) / 1) * 100,
    },
    image_filename: imageFilename ?? undefined,
    image_url: imageFilename ? `${BASE_URL}/uploads/${imageFilename}` : undefined,
    address: inc.address || undefined,
  }
}

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

  logout: (redirectTo: string = "/login") => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    window.location.href = redirectTo
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

  getIncidents: async (options?: { includeResolved?: boolean }) => {
    const params = new URLSearchParams()
    if (options?.includeResolved) {
      params.set("include_resolved", "true")
    }
    const path = params.size > 0 ? `/incidents/?${params.toString()}` : "/incidents/"
    const { ok, data } = await safeFetch(path)
    if (!ok || !Array.isArray(data)) return []
    return data.map(normalizeIncident)
  },

  getMyReportedIncidents: async (options?: { includeResolved?: boolean }) => {
    const params = new URLSearchParams()
    if (options?.includeResolved !== undefined) {
      params.set("include_resolved", String(options.includeResolved))
    }
    const path = params.size > 0 ? `/incidents/my-reports?${params.toString()}` : "/incidents/my-reports"
    const { ok, data } = await safeFetch(path)
    if (!ok || !Array.isArray(data)) return []
    return data.map(normalizeIncident)
  },

  getIncidentReports: async (incidentId: string) => {
    const { ok, data } = await safeFetch(`/incidents/${incidentId}/reports`)
    if (!ok || !data || !Array.isArray(data.reports)) {
      return null
    }

    return {
      incident_id: String(data.incident_id),
      incident_title: data.incident_title,
      reports: data.reports.map((report: BackendIncidentReportDetail) => ({
        id: String(report.id),
        user_id: report.user_id,
        user_name: report.user_name,
        user_email: report.user_email,
        created_at: new Date(report.created_at),
        latitude: report.latitude,
        longitude: report.longitude,
        image_filename: report.image_filename ?? undefined,
        image_url: report.image_filename ? `${BASE_URL}/uploads/${report.image_filename}` : undefined,
      })),
    }
  },

  getPendingResolutionRequests: async () => {
    const { ok, data } = await safeFetch("/incidents/pending-resolution-requests")
    if (!ok || !Array.isArray(data)) return []
    return data.map((item) => ({
      request_id: String(item.request_id),
      incident_id: String(item.incident_id),
      incident_title: item.incident_title,
      category: item.category,
      requested_at: new Date(item.requested_at),
      requested_by_admin_name: item.requested_by_admin_name,
      requested_by_admin_email: item.requested_by_admin_email,
    })) as PendingResolutionRequest[]
  },

  respondToResolutionRequest: async (requestId: string, payload: { resolved: boolean; message?: string }) => {
    const { ok, data, error } = await safeFetch(`/incidents/resolution-requests/${requestId}/respond`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    if (!ok) throw new Error(error || "Failed to submit your confirmation")
    return data
  },

  requestIncidentResolution: async (incidentId: string) => {
    const { ok, data, error } = await safeFetch(`/incidents/${incidentId}/request-resolution`, {
      method: "POST",
    })
    if (!ok) throw new Error(error || "Failed to request resolution confirmation")
    return data
  },

  getAdminResolutionFeedback: async () => {
    const { ok, data } = await safeFetch("/incidents/admin-resolution-feedback")
    if (!ok || !Array.isArray(data)) return []
    return data.map((item) => ({
      request_id: String(item.request_id),
      incident_id: String(item.incident_id),
      incident_title: item.incident_title,
      category: item.category,
      user_name: item.user_name,
      user_email: item.user_email,
      status: item.status,
      response_message: item.response_message ?? undefined,
      created_at: new Date(item.created_at),
      responded_at: item.responded_at ? new Date(item.responded_at) : undefined,
    })) as AdminResolutionFeedback[]
  },

  getMe: async () => {
    const { ok, data } = await safeFetch("/auth/me")
    if (!ok || !data) return null
    return data as BackendUser
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

  resolveIncident: async (incidentId: string) => {
    const { ok, data, error } = await safeFetch(`/incidents/${incidentId}/resolve`, {
      method: "POST",
    })
    if (!ok) throw new Error(error || "Failed to resolve incident")
    return normalizeIncident(data)
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
