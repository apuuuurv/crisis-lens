'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, MessageSquareWarning } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PendingResolutionRequest } from '@/lib/api'

interface ResolutionRequestsPanelProps {
  requests: Array<PendingResolutionRequest & { relativeTime: string }>
  onRespond: (requestId: string, payload: { resolved: boolean; message?: string }) => Promise<void>
}

export function ResolutionRequestsPanel({ requests, onRespond }: ResolutionRequestsPanelProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [rejectionTarget, setRejectionTarget] = useState<(PendingResolutionRequest & { relativeTime: string }) | null>(null)
  const [rejectionMessage, setRejectionMessage] = useState('')

  const handleConfirm = async (requestId: string) => {
    setSubmittingId(requestId)
    try {
      await onRespond(requestId, { resolved: true })
    } finally {
      setSubmittingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectionTarget) return
    setSubmittingId(rejectionTarget.request_id)
    try {
      await onRespond(rejectionTarget.request_id, {
        resolved: false,
        message: rejectionMessage.trim() || undefined,
      })
      setRejectionTarget(null)
      setRejectionMessage('')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <>
      <Card className="rounded-[28px] border-glass-border bg-glass text-foreground">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-[family:var(--font-display)] text-2xl">Resolution confirmations</CardTitle>
            <Badge className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-amber-300">
              {requests.length} pending
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Admin asked you to confirm whether these reported issues are actually resolved.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
              No pending confirmations
            </div>
          ) : (
            requests.map((request, index) => (
              <motion.div
                key={request.request_id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-[24px] border border-border bg-card/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{request.incident_title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Requested by {request.requested_by_admin_name} • {request.relativeTime}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {request.category}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleConfirm(request.request_id)}
                    disabled={submittingId === request.request_id}
                    className="bg-emerald-500 text-black hover:bg-emerald-400"
                  >
                    {submittingId === request.request_id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Yes, resolved
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectionTarget(request)}
                    disabled={submittingId === request.request_id}
                    className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
                  >
                    <MessageSquareWarning className="size-4" />
                    No, still active
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!rejectionTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectionTarget(null)
            setRejectionMessage('')
          }
        }}
      >
        <DialogContent className="border-glass-border bg-glass backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Send Follow-up To Admin</DialogTitle>
            <DialogDescription>
              Explain why this issue is still active so the admin can review it again.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionMessage}
            onChange={(event) => setRejectionMessage(event.target.value)}
            placeholder="Example: Water is still rising near the same street and responders have not reached yet."
            className="min-h-[120px] bg-card/80"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionTarget || submittingId === rejectionTarget.request_id}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              {rejectionTarget && submittingId === rejectionTarget.request_id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MessageSquareWarning className="size-4" />
              )}
              Send to admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
