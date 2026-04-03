"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import type { Incident, IncidentCategory, IncidentStatus } from "@/lib/crisis-data"

interface ReportIncidentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (incident: Omit<Incident, "id" | "timestamp" | "upvotes" | "is_verified" | "location">) => void
}

export function ReportIncidentDialog({
  open,
  onOpenChange,
  onSubmit,
}: ReportIncidentDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<IncidentCategory>("Fire")
  const [severity, setSeverity] = useState([5])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(f => f.type.startsWith("image/"))
    
    // Simulate file upload
    imageFiles.forEach(file => {
      setUploadedFiles(prev => [...prev, file])
    })
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        setUploadedFiles(prev => [...prev, file])
      })
    }
  }, [])

  const removeFile = (file: File) => {
    setUploadedFiles(prev => prev.filter(f => f !== file))
  }

  const handleSubmit = () => {
    if (!title.trim() && uploadedFiles.length === 0) return

    if (uploadedFiles.length > 0) {
      const formData = new FormData()
      formData.append("file", uploadedFiles[0])
      onSubmit(formData as any)
    } else {
      onSubmit({
        title,
        description,
        category,
        severity: severity[0],
        // status is handled by backend or default
      } as any)
    }

    // Reset form
    setTitle("")
    setDescription("")
    setCategory("Fire")
    setSeverity([5])
    setUploadedFiles([])
    onOpenChange(false)
  }

  const categories: IncidentCategory[] = [
    "Fire",
    "Flood",
    "Earthquake",
    "Storm",
    "Chemical",
    "Medical",
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-glass-border bg-glass backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="size-5 text-amber" />
            Report Incident
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submit a new incident report for verification and response.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">
              Incident Title
            </Label>
            <Input
              id="title"
              placeholder="Brief description of the incident..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-border bg-input"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the incident..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] border-border bg-input"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-foreground">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as IncidentCategory)}>
              <SelectTrigger className="border-border bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Severity Level</Label>
              <span className={`font-mono text-sm font-bold ${
                severity[0] >= 8 ? "text-rose" :
                severity[0] >= 5 ? "text-amber" : "text-emerald"
              }`}>
                {severity[0]}/10
              </span>
            </div>
            <Slider
              value={severity}
              onValueChange={setSeverity}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>Moderate</span>
              <span>Critical</span>
            </div>
          </div>

          {/* Image Upload Zone */}
          <div className="space-y-2">
            <Label className="text-foreground">Evidence (Optional)</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragOver
                  ? "border-emerald bg-emerald/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <Upload className={`mx-auto mb-2 size-8 ${
                isDragOver ? "text-emerald" : "text-muted-foreground"
              }`} />
              <p className="text-sm text-muted-foreground">
                Drag & drop images or click to upload
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                AI will extract location and incident details
              </p>
            </div>

            {/* Uploaded Files */}
            <AnimatePresence>
              {uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2"
                >
                  {uploadedFiles.map((file) => (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      <span className="max-w-[100px] truncate">{file.name}</span>
                      <button
                        onClick={() => removeFile(file)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="bg-emerald text-primary-foreground hover:bg-emerald/90"
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
