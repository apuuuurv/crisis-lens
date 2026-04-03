"use client"

import { motion } from "framer-motion"
import { ThumbsUp, Send, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Incident } from "@/lib/crisis-data"
import { 
  categoryColors, 
  statusColors, 
  getSeverityColor, 
  formatTimeAgo 
} from "@/lib/crisis-data"

interface CrisisFeedProps {
  incidents: Incident[]
  onUpvote: (id: string) => void
  onDispatch: (incident: Incident) => void
  compact?: boolean
}

export function CrisisFeed({ 
  incidents, 
  onUpvote, 
  onDispatch,
  compact = true 
}: CrisisFeedProps) {
  const sortedIncidents = [...incidents].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )

  return (
    <div className="space-y-3 p-4">
      {sortedIncidents.map((incident, index) => (
        <motion.div
          key={incident.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`rounded-lg border border-border bg-card/50 p-4 backdrop-blur-sm transition-colors hover:border-border/80 ${
            compact ? "" : "hover:bg-card/70"
          }`}
        >
          {/* Header */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${categoryColors[incident.category]}`}
                >
                  {incident.category}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${statusColors[incident.status]}`}
                >
                  {incident.status === "Active" && (
                    <AlertTriangle className="mr-1 size-3" />
                  )}
                  {incident.status === "Verifying" && (
                    <Clock className="mr-1 size-3" />
                  )}
                  {incident.status === "Resolved" && (
                    <CheckCircle className="mr-1 size-3" />
                  )}
                  {incident.status}
                </Badge>
                {incident.is_verified && (
                  <Badge variant="outline" className="border-emerald/30 bg-emerald/10 text-emerald text-xs">
                    <CheckCircle className="mr-1 size-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <h3 className="font-medium leading-tight text-foreground">
                {incident.title}
              </h3>
            </div>
          </div>

          {/* Severity Meter */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Severity</span>
              <span className={`font-semibold ${
                incident.severity >= 8 ? "text-rose" :
                incident.severity >= 5 ? "text-amber" : "text-emerald"
              }`}>
                {incident.severity}/10
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`h-full ${getSeverityColor(incident.severity)}`}
                initial={{ width: 0 }}
                animate={{ width: `${incident.severity * 10}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Description (if not compact) */}
          {!compact && (
            <p className="mb-3 text-sm text-muted-foreground">
              {incident.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(incident.timestamp)}
            </span>
            <div className="flex items-center gap-2">
              {/* Verify/Upvote Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpvote(incident.id)}
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-emerald"
              >
                <ThumbsUp className="size-3" />
                {incident.upvotes}
              </Button>

              {/* Dispatch Button */}
              {incident.status !== "Resolved" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDispatch(incident)}
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-amber"
                >
                  <Send className="size-3" />
                  Dispatch
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
