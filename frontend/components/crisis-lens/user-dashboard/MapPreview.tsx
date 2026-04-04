'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Incident } from '@/lib/crisis-data'

interface MapPreviewProps {
  incidents: Incident[]
}

const LiveMap = dynamic(() => import('@/components/crisis-lens/live-map'), { ssr: false })

export function MapPreview({ incidents }: MapPreviewProps) {
  return (
    <Card className="rounded-[28px] border-glass-border bg-glass text-foreground">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="font-[family:var(--font-display)] text-2xl">Live incidents</CardTitle>
            <Badge className="rounded-full border border-border bg-card/80 px-3 py-1 text-foreground">
              {incidents.length} total
            </Badge>
          </div>
          <Button asChild variant="outline" className="rounded-full border-border bg-card/80 text-foreground hover:bg-accent hover:text-accent-foreground">
            <Link href="/report">
              Open report map
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] overflow-hidden rounded-[26px] border border-border">
          <LiveMap incidents={incidents} resources={[]} />
        </div>
      </CardContent>
    </Card>
  )
}
