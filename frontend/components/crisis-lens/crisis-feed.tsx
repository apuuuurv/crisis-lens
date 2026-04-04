"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ThumbsUp, Send, CheckCircle, AlertTriangle, Clock, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Incident } from "@/lib/crisis-data"
import { apiClient, type IncidentReportDetail } from "@/lib/api"
import { 
  categoryColors, 
  statusColors, 
  getHeatColor, 
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
  const [previewIncident, setPreviewIncident] = useState<Incident | null>(null)
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false)
  const [reportHistoryOpen, setReportHistoryOpen] = useState(false)
  const [reportHistoryLoading, setReportHistoryLoading] = useState(false)
  const [reportHistoryError, setReportHistoryError] = useState<string | null>(null)
  const [reportHistoryIncident, setReportHistoryIncident] = useState<Incident | null>(null)
  const [reportHistory, setReportHistory] = useState<IncidentReportDetail[]>([])
  const [previewReport, setPreviewReport] = useState<IncidentReportDetail | null>(null)
  const [previewReportLoadFailed, setPreviewReportLoadFailed] = useState(false)
  const sortedIncidents = [...incidents].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )

  const previewDescription = useMemo(() => {
    if (!previewIncident?.description) return ""
    return previewIncident.description.replace(/\s*File:\s*[^\s]+$/i, "").trim()
  }, [previewIncident])

  const openReportHistory = async (incident: Incident) => {
    setReportHistoryOpen(true)
    setReportHistoryLoading(true)
    setReportHistoryError(null)
    setReportHistoryIncident(incident)

    try {
      const response = await apiClient.getIncidentReports(incident.id)
      if (!response) {
        setReportHistory([])
        setReportHistoryError("Unable to load report history right now.")
        return
      }
      setReportHistory(response.reports)
    } catch {
      setReportHistory([])
      setReportHistoryError("Unable to load report history right now.")
    } finally {
      setReportHistoryLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-3 p-4">
        {sortedIncidents.map((incident, index) => {
          const cleanedDescription = incident.description.replace(/\s*File:\s*[^\s]+$/i, "").trim()

          return (
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

          {/* Heat Meter (Report Volume) */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Report Volume</span>
              <button
                type="button"
                onClick={() => openReportHistory(incident)}
                className={`font-semibold transition hover:opacity-80 ${
                  incident.report_count >= 10 ? "text-rose" :
                  incident.report_count >= 5 ? "text-amber" : "text-emerald"
                }`}
              >
                {incident.report_count} {incident.report_count === 1 ? 'Report' : 'Reports'}
              </button>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`h-full ${getHeatColor(incident.report_count)}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((incident.report_count / 10) * 100, 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Description (if not compact) */}
          {!compact && (
            <p className="mb-3 text-sm text-muted-foreground">
              {cleanedDescription}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(incident.timestamp)}
            </span>
            <div className="flex items-center gap-2">
              {incident.image_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewLoadFailed(false)
                    setPreviewIncident(incident)
                  }}
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-blue-400"
                >
                  <ImageIcon className="size-3" />
                  Preview image
                </Button>
              )}
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
          )
        })}
      </div>

      <Dialog
        open={!!previewIncident}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewIncident(null)
            setPreviewLoadFailed(false)
          }
        }}
      >
        <DialogContent className="max-w-3xl border-border bg-card/95 text-card-foreground backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Uploaded Image Preview</DialogTitle>
            <DialogDescription>
              {previewIncident?.title}
            </DialogDescription>
          </DialogHeader>
          {previewIncident?.image_url ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                {previewLoadFailed ? (
                  <div className="flex min-h-[280px] items-center justify-center px-6 py-12 text-center">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Image file is not available on the server.</p>
                      <p className="text-sm text-muted-foreground">
                        This incident has a saved filename, but the original uploaded file could not be found.
                      </p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={previewIncident.image_url}
                    alt={previewIncident.title}
                    className="max-h-[70vh] w-full object-contain"
                    onError={() => setPreviewLoadFailed(true)}
                    onLoad={() => setPreviewLoadFailed(false)}
                  />
                )}
              </div>
              {previewDescription ? (
                <p className="text-sm text-muted-foreground">{previewDescription}</p>
              ) : null}
              {previewIncident.image_filename ? (
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  File: {previewIncident.image_filename}
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={reportHistoryOpen}
        onOpenChange={(open) => {
          setReportHistoryOpen(open)
          if (!open) {
            setReportHistory([])
            setReportHistoryIncident(null)
            setReportHistoryError(null)
          }
        }}
      >
        <DialogContent className="max-w-3xl border-border bg-card/95 text-card-foreground backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Report History</DialogTitle>
            <DialogDescription>
              {reportHistoryIncident?.title ?? "Incident"} reported by {reportHistory.length} contributor{reportHistory.length === 1 ? "" : "s"}.
            </DialogDescription>
          </DialogHeader>

          {reportHistoryLoading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <Loader2 className="size-6 animate-spin text-emerald-400" />
            </div>
          ) : reportHistoryError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-200">
              {reportHistoryError}
            </div>
          ) : (
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-3">
                {reportHistory.map((report) => (
                  <div key={report.id} className="rounded-xl border border-border bg-card/60 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{report.user_name}</p>
                        <p className="text-sm text-muted-foreground">{report.user_email}</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{report.created_at.toLocaleString()}</p>
                        <p>{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        Report #{report.id}
                      </Badge>
                      {report.image_filename ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-2"
                          onClick={() => {
                            setPreviewReport(report)
                            setPreviewReportLoadFailed(false)
                          }}
                        >
                          <ImageIcon className="size-3.5" />
                          Preview uploaded image
                        </Button>
                      ) : (
                        <Badge variant="outline" className="rounded-full text-muted-foreground">
                          No image uploaded
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {reportHistory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    No per-report history found for this incident yet.
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewReport}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewReport(null)
            setPreviewReportLoadFailed(false)
          }
        }}
      >
        <DialogContent className="max-w-3xl border-border bg-card/95 text-card-foreground backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Reported Image</DialogTitle>
            <DialogDescription>
              {previewReport ? `${previewReport.user_name} • ${previewReport.created_at.toLocaleString()}` : ""}
            </DialogDescription>
          </DialogHeader>
          {previewReport?.image_url ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                {previewReportLoadFailed ? (
                  <div className="flex min-h-[280px] items-center justify-center px-6 py-12 text-center">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Image file is not available on the server.</p>
                      <p className="text-sm text-muted-foreground">
                        This report has a saved filename, but the uploaded file could not be found.
                      </p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={previewReport.image_url}
                    alt={previewReport.image_filename ?? "Uploaded report image"}
                    className="max-h-[70vh] w-full object-contain"
                    onError={() => setPreviewReportLoadFailed(true)}
                    onLoad={() => setPreviewReportLoadFailed(false)}
                  />
                )}
              </div>
              {previewReport.image_filename ? (
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  File: {previewReport.image_filename}
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
