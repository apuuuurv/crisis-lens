"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Send, AlertTriangle, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Incident, Resource } from "@/lib/crisis-data"
import { categoryColors, getSeverityColor } from "@/lib/crisis-data"

interface DispatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incident: Incident | null
  resources: Resource[]
  onDispatch: (resourceId: string, incidentId: string) => void
}

export function DispatchDialog({
  open,
  onOpenChange,
  incident,
  resources,
  onDispatch,
}: DispatchDialogProps) {
  const [selectedResource, setSelectedResource] = useState<string | null>(null)

  const handleDispatch = () => {
    if (selectedResource && incident) {
      onDispatch(selectedResource, incident.id)
      setSelectedResource(null)
      onOpenChange(false)
    }
  }

  const getResourceIcon = (type: Resource["type"]) => {
    switch (type) {
      case "Ambulance":
        return "🚑"
      case "Fire Truck":
        return "🚒"
      case "Police":
        return "🚔"
      case "Rescue":
        return "🛟"
      case "Helicopter":
        return "🚁"
    }
  }

  if (!incident) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-glass-border bg-glass backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Send className="size-5 text-amber" />
            Dispatch Resource
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Assign an available unit to respond to this incident.
          </DialogDescription>
        </DialogHeader>

        {/* Incident Summary */}
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <div className="mb-2 flex items-start justify-between">
            <Badge 
              variant="outline" 
              className={`text-xs ${categoryColors[incident.category]}`}
            >
              {incident.category}
            </Badge>
            <span className={`text-sm font-bold ${
              incident.severity >= 8 ? "text-rose" :
              incident.severity >= 5 ? "text-amber" : "text-emerald"
            }`}>
              Severity: {incident.severity}/10
            </span>
          </div>
          <h3 className="mb-1 font-semibold text-foreground">{incident.title}</h3>
          <p className="text-sm text-muted-foreground">{incident.description}</p>
          
          {/* Severity bar */}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={`h-full ${getSeverityColor(incident.severity)}`}
              initial={{ width: 0 }}
              animate={{ width: `${incident.severity * 10}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Available Resources */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Available Units ({resources.length})
          </h4>
          
          {resources.length === 0 ? (
            <div className="rounded-lg border border-amber/30 bg-amber/10 p-4 text-center">
              <AlertTriangle className="mx-auto mb-2 size-8 text-amber" />
              <p className="text-sm text-amber">No units currently available</p>
              <p className="mt-1 text-xs text-muted-foreground">
                All resources are currently dispatched or returning
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {resources.map((resource) => (
                  <motion.button
                    key={resource.id}
                    onClick={() => setSelectedResource(resource.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedResource === resource.id
                        ? "border-emerald bg-emerald/10"
                        : "border-border bg-card hover:bg-card/80"
                    }`}
                  >
                    <span className="text-2xl">{getResourceIcon(resource.type)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{resource.unit_name}</p>
                      <p className="text-xs text-muted-foreground">{resource.type}</p>
                    </div>
                    {selectedResource === resource.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle className="size-5 text-emerald" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDispatch}
            disabled={!selectedResource}
            className="bg-amber text-primary-foreground hover:bg-amber/90"
          >
            <Send className="mr-2 size-4" />
            Dispatch Unit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
