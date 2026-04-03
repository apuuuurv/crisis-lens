"use client"

import { useEffect, useState } from "react"
import { Dashboard } from "@/components/crisis-lens/dashboard"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function DashboardPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const isAuth = apiClient.isAuthenticated()
    const role = apiClient.getRole()

    // Step 1: Unauthenticated -> Silent Redirect to Login
    if (!isAuth) {
      router.push("/login")
      return
    }

    // Step 2: Authenticated but not Admin -> Toast + Redirect to Report
    if (role !== "admin") {
      toast.error("Access Denied", { 
        description: "Admin privileges required for Command Center.",
        duration: 5000 
      })
      router.push("/report")
      return
    }

    // Final Step: Authorized Admin
    setAuthorized(true)
  }, [router])

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }
  
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Dashboard onBackToLanding={() => router.push("/")} />
    </main>
  )
}
