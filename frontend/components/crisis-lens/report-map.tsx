"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface ReportMapProps {
  onLocationSelect: (lat: number, lng: number) => void
  position: [number, number] | null
}

// Fix for default marker icons
const PickerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function LocationPicker({ onLocationSelect, position }: { onLocationSelect: (lat: number, lng: number) => void, position: [number, number] | null }) {
  const map = useMapEvents({
    click(e: any) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  
  if (!position) return null

  return (
    <Marker 
      position={position} 
      icon={PickerIcon} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const { lat, lng } = marker.getLatLng()
          onLocationSelect(lat, lng)
        },
      }}
    />
  )
}

function MapCentering({ position }: { position: [number, number] | null }) {
  const map = useMapEvents({})
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15)
    }
  }, [position, map])
  return null
}

export default function ReportMap({ onLocationSelect, position }: ReportMapProps) {
  return (
    <MapContainer
      center={[34.0522, -118.2437]}
      zoom={13}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <LocationPicker onLocationSelect={onLocationSelect} position={position} />
      <MapCentering position={position} />
    </MapContainer>
  )
}
