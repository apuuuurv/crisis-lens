"use client"

import { useEffect, useState } from "react"
import { ReportView } from "@/components/crisis-lens/report-view"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

export default function ReportPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push("/login")
    } else {
      setAuthorized(true)
    }
  }, [router])

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-4">
        <Link href="/">
          <Button variant="ghost" className="gap-2 text-muted-foreground">
            <ChevronLeft className="size-4" />
            Home
          </Button>
        </Link>
      </div>
      <ReportView />
    </main>
  )
}
