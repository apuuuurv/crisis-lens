"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Dashboard } from "@/components/crisis-lens/dashboard"
import { UserDashboard } from "@/components/crisis-lens/user-dashboard/UserDashboard"
import { apiClient } from "@/lib/api"

export default function DashboardPage() {
  const router = useRouter()
  const [authState, setAuthState] = useState<"loading" | "admin" | "user">("loading")

  useEffect(() => {
    const isAuth = apiClient.isAuthenticated()
    const role = apiClient.getRole()

    if (!isAuth) {
      router.push("/login")
      return
    }

    setAuthState(role === "admin" ? "admin" : "user")
  }, [router])

  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {authState === "admin" ? (
        <Dashboard onBackToLanding={() => apiClient.logout("/")} />
      ) : (
        <UserDashboard onLogout={() => apiClient.logout()} />
      )}
    </main>
  )
}
