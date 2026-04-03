"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import "leaflet.heat"
import { MapPin, Flame } from "lucide-react"
import type { Incident, Resource } from "@/lib/crisis-data"

// Fix for default marker icons not showing in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

interface LiveMapProps {
  incidents: Incident[]
  resources: Resource[]
  onIncidentClick?: (incident: Incident) => void
}

function MapUpdater({ incidents }: { incidents: Incident[] }) {
  const map = useMap()
  useEffect(() => {
    if (incidents.length > 0) {
      const latest = incidents[0]
      if (latest.latitude && latest.longitude) {
        map.setView([latest.latitude, latest.longitude], map.getZoom())
      }
    }
  }, [incidents, map])
  return null
}

function HeatmapLayer({ incidents }: { incidents: Incident[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || incidents.length === 0) return

    const points = incidents
      .filter(i => i.latitude && i.longitude)
      .map(i => [i.latitude, i.longitude, Math.min(i.report_count / 10, 1.0)] as [number, number, number])

    // @ts-ignore - leaflet.heat adds heatLayer to L
    const heat = L.heatLayer(points, {
      radius: 35,
      blur: 20,
      maxZoom: 15,
      gradient: { 
        0.2: 'blue', 
        0.4: 'cyan', 
        0.6: 'lime', 
        0.8: 'yellow', 
        1.0: 'red' 
      }
    }).addTo(map)

    return () => {
      map.removeLayer(heat)
    }
  }, [map, incidents])

  return null
}

export default function LiveMap({ incidents, resources, onIncidentClick }: LiveMapProps) {
  const defaultCenter: [number, number] = [37.7749, -122.4194]
<<<<<<< HEAD
  const [showHeatmap, setShowHeatmap] = useState(false)

  return (
    <div className="group relative h-full w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      {/* Heatmap Toggle */}
      <div className="absolute right-4 top-4 z-[1001]">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all ${
            showHeatmap 
              ? "border-red-500/50 bg-red-500/10 text-red-500" 
              : "border-border bg-background/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flame className={`size-3.5 ${showHeatmap ? "animate-pulse" : ""}`} />
          {showHeatmap ? "Heatmap Active" : "Thermal View"}
        </button>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={18} // Stops requesting new tiles from Esri at zoom level 18
          maxZoom={22}       // Allows the user to physically zoom into the map up to level 22
          attribution="Tiles &copy; Esri &mdash; Source: Esri..."
        />
=======
  const [isMounted, setIsMounted] = useState(false)
  const [mapInstanceKey] = useState(() => `live-map-${Date.now()}`)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <div className="pointer-events-none absolute inset-0 z-[1000] bg-[rgba(16,185,129,0.03)] opacity-20 transition-opacity group-hover:opacity-10" />
>>>>>>> 84925f3 (added docker)

      {isMounted ? (
        <MapContainer
          key={mapInstanceKey}
          center={defaultCenter}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={18}
            maxZoom={22}
            attribution="Tiles &copy; Esri &mdash; Source: Esri..."
          />

<<<<<<< HEAD
        <MapUpdater incidents={incidents} />
        {showHeatmap && <HeatmapLayer incidents={incidents} />}

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {/* Incident Markers */}
          {incidents.map((incident) => (
            (incident.latitude && incident.longitude) ? (
=======
          <MapUpdater incidents={incidents} />

          {incidents.map((incident) => (
            incident.latitude && incident.longitude ? (
>>>>>>> 84925f3 (added docker)
              <Marker
                key={incident.id}
                position={[incident.latitude, incident.longitude]}
                eventHandlers={{
                  click: () => onIncidentClick?.(incident),
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-2">
                    <h3 className="font-bold text-emerald-400">{incident.title}</h3>
                    {incident.address && (
                      <p className="mb-1 text-[10px] leading-tight text-zinc-400">
                        <MapPin className="mr-1 inline-block size-3" />
                        {incident.address}
                      </p>
                    )}
<<<<<<< HEAD
                    <p className="text-xs text-zinc-300">{incident.category} • Reports: {incident.report_count}</p>
=======
                    <p className="text-xs text-zinc-300">{incident.category} • Severity: {incident.severity}/10</p>
>>>>>>> 84925f3 (added docker)
                    <p className="mt-1 text-xs italic">{incident.status}</p>
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
<<<<<<< HEAD
        </MarkerClusterGroup>
=======
>>>>>>> 84925f3 (added docker)

          {resources.map((resource) => (
            resource.latitude && resource.longitude ? (
              <Marker
                key={resource.id}
                position={[resource.latitude, resource.longitude]}
                icon={L.divIcon({
                  className: "custom-div-icon",
                  html: `<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #3b82f6;"></div>`,
                  iconSize: [12, 12],
                  iconAnchor: [6, 6],
                })}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-blue-400">{resource.unit_name}</h3>
                    <p className="text-xs">{resource.type} • {resource.status}</p>
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
        </MapContainer>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          Loading map...
        </div>
      )}
    </div>
  )
}
