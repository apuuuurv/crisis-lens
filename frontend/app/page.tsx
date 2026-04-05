"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { LandingPage } from "@/components/landing/LandingPage"
import { apiClient } from "@/lib/api"

export default function Home() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      router.replace("/dashboard")
      return
    }

    setCheckingAuth(false)
  }, [router])

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1A1C1E]" />
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <LandingPage />
    </main>
  )
}
