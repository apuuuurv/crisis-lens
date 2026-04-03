"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MapPin, 
  Upload, 
  X, 
  AlertTriangle, 
  Shield, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import type { IncidentCategory } from "@/lib/crisis-data"
import dynamic from "next/dynamic"

// Dynamically import the map component with SSR disabled
const ReportMap = dynamic(() => import("./report-map"), { 
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-muted/50 text-muted-foreground">Loading Map Intelligence...</div>
})

export function ReportView() {
  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<IncidentCategory>("Fire")
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // 1. Geolocation on Mount
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          handleLocationSelect(latitude, longitude)
        },
        (error) => {
          console.error("Geolocation error:", error)
          // Default to LA if blocked, but map will show the user where they are
        }
      )
    }
  }, [])

  // 2. Reverse Geocoding (Nominatim API)
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      // Respect Nominatim's 1 req/s limit by not debouncing heavily yet, 
      // but wrapping in try/catch as requested.
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "en" } }
      )
      
      if (!response.ok) throw new Error("Rate limit or API error")
      
      const data = await response.json()
      // Extract a shorter, human-readable part of the address if possible
      const displayName = data.display_name || "Unknown Location"
      setAddress(displayName)
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      setAddress("Location unavailable")
    }
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setLocation([lat, lng])
    fetchAddress(lat, lng)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.[0]) {
      setUploadedFiles([files[0]])
    }
  }

  const removeFile = (file: File) => {
    setUploadedFiles(prev => prev.filter(f => f !== file))
  }

  const handleSubmit = async () => {
    if (!location) {
      toast.error("Please provide a location")
      return
    }

    if (!title.trim() && uploadedFiles.length === 0) {
      toast.error("Please provide a title or attach a photo")
      return
    }

    setIsSubmitting(true)
    try {
      let submissionResult
      if (uploadedFiles.length > 0) {
        const formData = new FormData()
        formData.append("file", uploadedFiles[0])
        submissionResult = await apiClient.reportIncidentWithImage(formData, {
          latitude: location[0],
          longitude: location[1],
          title: title,
          description: description,
          category: category
        })
      } else {
        submissionResult = await apiClient.reportIncident({
          title: title.trim(),
          description: description.trim(),
          category,
          latitude: location[0],
          longitude: location[1],
          address: address
        })
      }

      if (submissionResult.status === 201) {
        setIsSuccess(true)
        toast.success("Incident reported successfully")
      } else {
        toast.error("Report submission was not accepted by the server")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit report"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories: IncidentCategory[] = [
    "Fire", "Flood", "Earthquake", "Storm", "Chemical", "Medical"
  ]

  if (isSuccess) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-6 flex size-20 items-center justify-center rounded-full bg-emerald/10"
        >
          <CheckCircle2 className="size-12 text-emerald" />
        </motion.div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Report Received</h2>
        <p className="mb-8 max-w-xs text-muted-foreground">
          Thank you for your report. Emergency services have been notified and are reviewing the incident.
        </p>
        <Button onClick={() => window.location.href = "/"} className="bg-emerald">
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald/10">
            <Shield className="size-6 text-emerald" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Citizen Report</h1>
            <p className="text-sm text-muted-foreground">Public Reporting Portal</p>
          </div>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Step {step} of 2
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label className="text-base font-semibold">1. Incident Location</Label>
              <p className="text-sm text-muted-foreground">Tap the map to drop a pin where the incident is occurring.</p>
              
              <div className="relative h-[50vh] w-full overflow-hidden rounded-xl border border-border shadow-inner">
                <ReportMap onLocationSelect={handleLocationSelect} position={location} />
                
                {/* Geolocation Status / Address Overlay */}
                <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[1000] flex flex-col gap-2">
                  <AnimatePresence>
                    {address && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="rounded-lg border border-border bg-background/95 p-3 text-sm font-medium text-foreground shadow-xl backdrop-blur-md"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-emerald" />
                          <span className="line-clamp-2">{address}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!location && (
                  <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full border border-emerald/50 bg-background/90 px-4 py-2 text-sm font-medium text-emerald shadow-lg">
                      <MapPin className="size-4" />
                      Determining Location...
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                disabled={!location}
                onClick={() => setStep(2)}
                className="gap-2 bg-emerald px-8"
              >
                Next Details
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Button 
              variant="ghost" 
              onClick={() => setStep(1)}
              className="-ml-2 mb-2 gap-2 text-muted-foreground"
            >
              <ChevronLeft className="size-4" />
              Back to Map
            </Button>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Issue Summary {uploadedFiles.length > 0 ? "(Optional with photo)" : ""}
                </Label>
                <Input 
                  id="title" 
                  placeholder="e.g., Structure fire, Flooded intersection"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-card"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Additional Info (Optional)</Label>
                <Textarea 
                  id="desc" 
                  placeholder="Any details to help first responders..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-card"
                />
              </div>

              <div className="space-y-2">
                <Label>Photo Evidence</Label>
                <div className="relative flex min-h-[100px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 transition-colors hover:border-emerald/50">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileSelect}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  {uploadedFiles.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-2">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="group relative size-16 overflow-hidden rounded-lg border border-border">
                          <img 
                            src={URL.createObjectURL(f)} 
                            alt="upload" 
                            className="size-full object-cover" 
                          />
                          <button 
                            onClick={(e) => { e.preventDefault(); removeFile(f); }}
                            className="absolute right-0 top-0 bg-rose p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                      <div className="flex size-16 items-center justify-center rounded-lg border border-dashed border-border">
                        <Camera className="size-6 text-muted-foreground" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mb-2 size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload or take one photo</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-emerald py-6 text-lg font-bold"
            >
              {isSubmitting ? "Submitting..." : "SUBMIT REPORT"}
            </Button>
            
            <div className="flex items-center gap-2 rounded-lg bg-amber/5 p-3 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Making a false report is a criminal offense. Please ensure accuracy.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
