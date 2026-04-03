"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Shield, 
  Activity, 
  Radio, 
  MapPin, 
  AlertTriangle,
  Zap,
  Globe,
  Users,
  MessageSquare
} from "lucide-react"
import Link from "next/link"

interface LandingPageProps {
  // Props no longer needed for routing but kept for interface consistency if needed elsewhere
}

export function LandingPage({}: LandingPageProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Hero Background Wrapper - For future 3D/visual content */}
      <div className="absolute inset-0">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.28_0.01_260/0.3)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.28_0.01_260/0.3)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.72_0.19_160/0.08)_0%,transparent_70%)]" />
        
        {/* Animated Particles */}
        <div className="absolute inset-0">
          {isMounted && [...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute size-1 rounded-full bg-emerald"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Scanning Line Effect */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald to-transparent opacity-50"
          animate={{
            top: ["0%", "100%"],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Logo & Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center gap-3"
        >
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-emerald/20 blur-xl" />
            <Shield className="relative size-12 text-emerald" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-foreground">
            CrisisLens
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 max-w-4xl text-balance text-center text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl"
        >
          Real-Time{" "}
          <span className="text-emerald">Crisis Intelligence</span>
          <br />
          When Every Second Counts
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 max-w-2xl text-pretty text-center text-lg text-muted-foreground md:text-xl"
        >
          Advanced disaster resilience platform for coordinated emergency response. 
          Monitor incidents, dispatch resources, and protect communities with 
          AI-powered situational awareness.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col gap-4 sm:flex-row sm:gap-6"
        >
          <Link href="/report">
            <Button
              size="lg"
              className="group relative h-14 w-full overflow-hidden rounded-xl bg-emerald px-8 text-lg font-semibold text-primary-foreground shadow-lg shadow-emerald/25 transition-all hover:bg-emerald/90 hover:shadow-xl hover:shadow-emerald/30 sm:w-auto"
            >
              <span className="relative z-10 flex items-center gap-2">
                Report Incident
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <AlertTriangle className="size-5" />
                </motion.span>
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald via-primary via-50% to-emerald"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ opacity: 0.3 }}
              />
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full rounded-xl border-emerald/50 bg-emerald/5 px-8 text-lg font-semibold text-emerald transition-all hover:bg-emerald/10 sm:w-auto"
            >
              <span className="flex items-center gap-2">
                Command Center
                <Zap className="size-5" />
              </span>
            </Button>
          </Link>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {[
            { icon: Activity, label: "Active Monitoring", value: "24/7" },
            { icon: MapPin, label: "Coverage Zones", value: "1,200+" },
            { icon: Users, label: "First Responders", value: "50K+" },
            { icon: Globe, label: "Countries", value: "45" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <stat.icon className="size-6 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 grid max-w-5xl grid-cols-1 gap-4 px-4 md:grid-cols-3"
        >
          {[
            {
              icon: AlertTriangle,
              title: "Incident Detection",
              description: "AI-powered threat analysis with real-time anomaly detection",
              color: "text-amber",
            },
            {
              icon: Radio,
              title: "Unified Comms",
              description: "Seamless coordination across all emergency response teams",
              color: "text-emerald",
            },
            {
              icon: Shield,
              title: "Risk Analytics",
              description: "Predictive modeling for proactive disaster preparedness",
              color: "text-rose",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 + i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group rounded-xl border border-glass-border bg-glass p-6 backdrop-blur-xl transition-colors hover:border-border"
            >
              <feature.icon className={`mb-4 size-8 ${feature.color}`} />
              <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  )
}
