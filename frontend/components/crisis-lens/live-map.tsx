"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin } from "lucide-react"
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
  zones?: { zone_center_lat: number; zone_center_lng: number; risk_score: number; incident_count: number }[]
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

export default function LiveMap({ incidents, resources, zones = [], onIncidentClick }: LiveMapProps) {
  const defaultCenter: [number, number] = [37.7749, -122.4194]

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={18}
          maxZoom={22}
          attribution="Tiles &copy; Esri"
        />

        {/* Custom Scanline Overlay for Cyberpunk feel */}
        <div className="pointer-events-none absolute inset-0 z-[1000] bg-[rgba(16,185,129,0.03)] opacity-20 transition-opacity group-hover:opacity-10" />

        <MapUpdater incidents={incidents} />

        {/* Hazard Zones (Heatmap Cluster Visualization) */}
        {zones.map((zone, idx) => (
          <Circle
            key={`zone-${idx}`}
            center={[zone.zone_center_lat, zone.zone_center_lng]}
            radius={zone.incident_count * 1000} // 1km per incident in cluster
            pathOptions={{
              fillColor: "red",
              fillOpacity: zone.risk_score / 150, // Proportional to risk
              color: "darkred",
              weight: 1,
              dashArray: "5, 10"
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-rose">High Risk Zone</h3>
                <p className="text-xs text-zinc-400">Risk Score: {zone.risk_score}/100</p>
                <p className="text-xs text-zinc-400">Localized Incidents: {zone.incident_count}</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Incident Markers */}
        {incidents.map((incident) => (
          (incident.latitude && incident.longitude) ? (
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
                  <p className="text-xs text-zinc-300">{incident.category} • Severity: {incident.severity}/10</p>
                  <p className="mt-1 text-xs italic">{incident.status}</p>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}

        {/* Resource Markers */}
        {resources.map((resource) => (
          (resource.latitude && resource.longitude) ? (
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
    </div>
  )
}
