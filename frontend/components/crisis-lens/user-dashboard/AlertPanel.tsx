'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Flame, Droplets, FlaskConical, Activity, AlertTriangle, MapPin, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'

interface AlertPanelProps {
  userLocation?: { lat: number; lng: number } | null
}

interface Recommendation {
  type: string
  title: string
  category: string
  severity: "High" | "Medium" | "Low"
  recommendation: string
}

export function AlertPanel({ userLocation }: AlertPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    const fetchRecommendations = async () => {
      if (!userLocation) return
      setLoading(true)
      try {
        const data = await apiClient.getSafetyRecommendations(userLocation.lat, userLocation.lng)
        if (active) {
          setRecommendations(data || [])
        }
      } catch (error) {
        console.error("Failed to fetch safety recommendations", error)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchRecommendations()
    const interval = setInterval(fetchRecommendations, 30000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [userLocation])

  const getIcon = (category: string) => {
    const cat = category.toLowerCase()
    if (cat.includes('fire')) return <Flame className="size-5" />
    if (cat.includes('flood')) return <Droplets className="size-5" />
    if (cat.includes('chemical')) return <FlaskConical className="size-5" />
    if (cat.includes('earthquake')) return <Activity className="size-5" />
    if (cat.includes('medical')) return <span className="text-lg leading-none">🚑</span>
    return <AlertTriangle className="size-5" />
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'High':
        return {
          wrapper: 'border-rose-500/40 bg-gradient-to-br from-rose-950/40 to-rose-900/10 shadow-[0_0_30px_-10px_rgba(244,63,94,0.15)]',
          iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          title: 'text-rose-100',
          badge: 'bg-rose-500 text-white shadow-[0_0_15px_-3px_rgba(244,63,94,0.4)]',
          textWrapper: 'border-rose-500/30 bg-rose-950/30',
          text: 'text-rose-200/90',
        }
      case 'Medium':
        return {
          wrapper: 'border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-amber-900/10 shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)]',
          iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          title: 'text-amber-100',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          textWrapper: 'border-amber-500/30 bg-amber-950/30',
          text: 'text-amber-200/90',
        }
      default:
        return {
          wrapper: 'border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-blue-900/10 shadow-[0_0_30px_-10px_rgba(59,130,246,0.1)]',
          iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          title: 'text-blue-100',
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          textWrapper: 'border-blue-500/30 bg-blue-950/30',
          text: 'text-blue-200/90',
        }
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-glass-border bg-glass/60 backdrop-blur-2xl shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="shrink-0 border-b border-white/5 p-6 relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-inner">
              <Zap className="size-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-[family:var(--font-display)] text-xl font-semibold text-foreground tracking-tight">Intelligence</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest mt-0.5 font-medium">Safety AI</p>
            </div>
          </div>
          <Badge 
            className={`rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-wide uppercase transition-colors ${
              recommendations.length > 0 
                ? 'border-rose-500/40 bg-rose-500/20 text-rose-300' 
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {recommendations.length} Active
          </Badge>
        </div>
      </div>

      {/* Content Body */}
      <div 
        className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar relative z-10" 
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}
      >
        {!userLocation ? (
           <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
             <div className="flex size-16 items-center justify-center rounded-full bg-white/5 mb-4 border border-white/10">
               <MapPin className="size-8 text-muted-foreground/50" />
             </div>
             <p className="text-sm font-medium text-muted-foreground max-w-[200px]">Location needed to generate AI safety recommendations.</p>
           </div>
        ) : loading && recommendations.length === 0 ? (
           <div className="flex h-full items-center justify-center">
             <div className="relative flex size-14 items-center justify-center">
               <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
               <div className="absolute inset-0 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
               <ShieldCheck className="size-5 text-emerald-500/70" />
             </div>
           </div>
        ) : recommendations.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-full flex-col items-center justify-center rounded-[24px] border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-transparent px-6 py-10 text-center"
          >
            <div className="relative mb-5">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
              <div className="relative flex size-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]">
                <ShieldCheck className="size-8 text-emerald-400" />
              </div>
            </div>
            <h3 className="font-[family:var(--font-display)] text-2xl font-medium text-emerald-300">System Green</h3>
            <p className="mt-2 text-sm text-emerald-200/60 max-w-[220px] leading-relaxed">No immediate threats detected in your 10km radius.</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {recommendations.map((rec, index) => {
                const styles = getSeverityStyles(rec.severity)
                return (
                  <motion.div
                    key={`${rec.category}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, ease: 'easeOut' }}
                    className={`relative overflow-hidden rounded-[24px] border p-4 sm:p-5 transition-all hover:scale-[1.01] ${styles.wrapper}`}
                  >
                    {/* Background glow flair for high severity */}
                    {rec.severity === 'High' && (
                      <div className="absolute -top-10 -right-10 size-32 rounded-full bg-rose-500/20 blur-[40px] pointer-events-none" />
                    )}

                    <div className="relative z-10 flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-2xl border backdrop-blur-md ${styles.iconBg}`}>
                        {getIcon(rec.category)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className={`truncate font-semibold tracking-wide text-sm sm:text-base ${styles.title}`}>
                            {rec.title}
                          </h4>
                          <Badge className={`shrink-0 border uppercase tracking-widest text-[9px] sm:text-[10px] ${styles.badge}`}>
                            {rec.severity} Risk
                          </Badge>
                        </div>
                        
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 mb-3">
                          {rec.type.replace('_', ' ')}
                        </p>

                        <div className={`rounded-xl border p-3 sm:p-4 leading-relaxed text-xs sm:text-sm backdrop-blur-md ${styles.textWrapper}`}>
                          <p className={styles.text}>{rec.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Scope a style block for the custom scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.1); border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.2); }
      `}} />
    </div>
  )
}
