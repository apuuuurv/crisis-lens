"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import type { Resource, Incident } from "@/lib/crisis-data"

interface ResourceTrayProps {
  resources: Resource[]
  incidents: Incident[]
}

export function ResourceTray({ resources, incidents }: ResourceTrayProps) {
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

  const getStatusColor = (status: Resource["status"]) => {
    switch (status) {
      case "Available":
        return "bg-emerald/20 text-emerald border-emerald/30"
      case "Dispatched":
        return "bg-amber/20 text-amber border-amber/30"
      case "Returning":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  return (
    <div className="bg-card/30 p-4 backdrop-blur-xl">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {resources.map((resource, index) => {
          const assignedIncident = incidents.find(
            (i) => i.id === resource.assigned_incident_id
          )

          return (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex min-w-[180px] flex-col rounded-lg border border-border bg-card p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{getResourceIcon(resource.type)}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{resource.unit_name}</p>
                  <p className="text-xs text-muted-foreground">{resource.type}</p>
                </div>
              </div>

              <Badge 
                variant="outline" 
                className={`w-fit text-xs ${getStatusColor(resource.status)}`}
              >
                {resource.status}
              </Badge>

              {assignedIncident && (
                <p className="mt-2 truncate text-xs text-amber">
                  → {assignedIncident.id}: {assignedIncident.title}
                </p>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
