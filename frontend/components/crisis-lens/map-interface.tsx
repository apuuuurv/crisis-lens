"use client"

import { motion } from "framer-motion"
import type { Incident, Resource } from "@/lib/crisis-data"
import { categoryColors } from "@/lib/crisis-data"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"

interface MapInterfaceProps {
  incidents: Incident[]
  resources: Resource[]
  onIncidentClick: (incident: Incident) => void
}

export function MapInterface({ incidents, resources, onIncidentClick }: MapInterfaceProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-card/30 backdrop-blur-xl">
      {/* Map Grid Background */}
      <div className="absolute inset-0">
        {/* Dark map base */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        
        {/* Grid lines */}
        <svg className="absolute inset-0 h-full w-full opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Stylized map elements */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Roads */}
          <path
            d="M 0 50 L 100 50"
            className="stroke-border"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 50 0 L 50 100"
            className="stroke-border"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 20 0 L 20 100"
            className="stroke-border"
            strokeWidth="0.3"
            fill="none"
            strokeDasharray="2,2"
          />
          <path
            d="M 80 0 L 80 100"
            className="stroke-border"
            strokeWidth="0.3"
            fill="none"
            strokeDasharray="2,2"
          />
          <path
            d="M 0 25 L 100 25"
            className="stroke-border"
            strokeWidth="0.3"
            fill="none"
            strokeDasharray="2,2"
          />
          <path
            d="M 0 75 L 100 75"
            className="stroke-border"
            strokeWidth="0.3"
            fill="none"
            strokeDasharray="2,2"
          />

          {/* Water feature */}
          <path
            d="M 60 80 Q 70 70 75 60 Q 80 50 85 55 Q 95 65 100 60"
            className="fill-none stroke-blue-500/30"
            strokeWidth="3"
          />

          {/* Building blocks */}
          <rect x="10" y="10" width="8" height="8" rx="1" className="fill-muted/30" />
          <rect x="25" y="30" width="12" height="10" rx="1" className="fill-muted/30" />
          <rect x="55" y="15" width="10" height="12" rx="1" className="fill-muted/30" />
          <rect x="85" y="35" width="8" height="8" rx="1" className="fill-muted/30" />
          <rect x="15" y="60" width="15" height="8" rx="1" className="fill-muted/30" />
          <rect x="70" y="75" width="10" height="10" rx="1" className="fill-muted/30" />

          {/* Parks */}
          <circle cx="40" cy="70" r="8" className="fill-emerald/10" />
          <circle cx="90" cy="15" r="6" className="fill-emerald/10" />
        </svg>

        {/* Scan lines effect */}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-emerald/5 to-transparent"
          style={{ height: "20%" }}
          animate={{
            y: ["0%", "500%"],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Incident Markers */}
      <TooltipProvider>
        {incidents.map((incident) => (
          <Tooltip key={incident.id}>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => onIncidentClick(incident)}
                className="absolute z-10"
                style={{
                  left: `${incident.location.x}%`,
                  top: `${incident.location.y}%`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.2 }}
              >
                {/* Pulse ring for active incidents */}
                {incident.status === "Active" && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-rose"
                    animate={{
                      scale: [1, 2.5],
                      opacity: [0.6, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                    style={{
                      width: 20,
                      height: 20,
                      marginLeft: -10,
                      marginTop: -10,
                    }}
                  />
                )}
                {/* Marker */}
                <motion.div
                  className={`relative flex size-5 items-center justify-center rounded-full shadow-lg ${
                    incident.status === "Active"
                      ? "bg-rose"
                      : incident.status === "Verifying"
                      ? "bg-amber"
                      : incident.status === "Resolved"
                      ? "bg-emerald"
                      : "bg-muted-foreground"
                  }`}
                  animate={
                    incident.status === "Active"
                      ? { scale: [1, 1.15, 1] }
                      : {}
                  }
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    marginLeft: -10,
                    marginTop: -10,
                  }}
                >
                  <span className="text-[8px] font-bold text-white">
                    {incident.severity}
                  </span>
                </motion.div>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="border-glass-border bg-glass backdrop-blur-xl"
            >
              <div className="max-w-xs">
                <p className="font-semibold text-foreground">{incident.title}</p>
                <p className="text-xs text-muted-foreground">
                  {incident.category} • Severity: {incident.severity}/10
                </p>
                <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs ${categoryColors[incident.category]}`}>
                  {incident.status}
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>

      {/* Resource Markers (Blue) */}
      <TooltipProvider>
        {resources.map((resource, index) => {
          const assignedIncident = incidents.find(
            (i) => i.id === resource.assigned_incident_id
          )
          if (!assignedIncident) return null
          
          // Offset slightly from incident
          const offsetX = (index % 3) * 3 - 3
          const offsetY = Math.floor(index / 3) * 3 + 5

          return (
            <Tooltip key={resource.id}>
              <TooltipTrigger asChild>
                <motion.div
                  className="absolute z-20"
                  style={{
                    left: `${assignedIncident.location.x + offsetX}%`,
                    top: `${assignedIncident.location.y + offsetY}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.div
                    className="flex size-4 items-center justify-center rounded-full bg-blue-500 shadow-lg ring-2 ring-blue-500/30"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(59, 130, 246, 0.4)",
                        "0 0 0 8px rgba(59, 130, 246, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <span className="text-[8px]">
                      {resource.type === "Ambulance" ? "A" :
                       resource.type === "Fire Truck" ? "F" :
                       resource.type === "Police" ? "P" :
                       resource.type === "Rescue" ? "R" : "H"}
                    </span>
                  </motion.div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent 
                side="top"
                className="border-glass-border bg-glass backdrop-blur-xl"
              >
                <p className="font-semibold text-foreground">{resource.unit_name}</p>
                <p className="text-xs text-muted-foreground">{resource.type}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TooltipProvider>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 rounded-lg border border-glass-border bg-glass p-3 backdrop-blur-xl">
        <p className="mb-2 text-xs font-semibold text-foreground">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="size-3 rounded-full bg-rose" />
            <span className="text-muted-foreground">Active Incident</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="size-3 rounded-full bg-amber" />
            <span className="text-muted-foreground">Verifying</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="size-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Resource Unit</span>
          </div>
        </div>
      </div>

      {/* Coordinates Display */}
      <div className="absolute right-4 top-4 rounded-lg border border-glass-border bg-glass px-3 py-2 backdrop-blur-xl">
        <p className="font-mono text-xs text-muted-foreground">
          SECTOR: <span className="text-emerald">ALPHA-7</span>
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          LAT: 34.0522° N | LON: 118.2437° W
        </p>
      </div>
    </div>
  )
}
