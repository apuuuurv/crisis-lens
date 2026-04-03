'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { CTASection } from './CTASection'
import { FeaturesSection } from './FeaturesSection'
import { Footer } from './Footer'
import { HeroSection } from './HeroSection'
import { HowItWorks } from './HowItWorks'
import { LivePreview } from './LivePreview'
import { MapSection } from './MapSection'
import { Navbar } from './Navbar'
import { StatsSection } from './StatsSection'
import { TestimonialSection } from './TestimonialSection'

export function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(apiClient.isAuthenticated())
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,163,0.14),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(to_bottom,_transparent,_rgba(15,23,42,0.04))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_86%)]" />
      </div>

      <Navbar isAuthenticated={isAuthenticated} />
      <main className="relative z-10">
        <HeroSection isAuthenticated={isAuthenticated} />
        <LivePreview />
        <FeaturesSection />
        <HowItWorks />
        <MapSection />
        <StatsSection />
        <TestimonialSection />
        <CTASection isAuthenticated={isAuthenticated} />
      </main>
      <Footer />
    </div>
  )
}
