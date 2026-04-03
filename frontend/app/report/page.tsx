"use client"

import { ReportView } from "@/components/crisis-lens/report-view"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function ReportPage() {
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
