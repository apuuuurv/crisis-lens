"use client"

import { Dashboard } from "@/components/crisis-lens/dashboard"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()
  
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Dashboard onBackToLanding={() => router.push("/")} />
    </main>
  )
}
