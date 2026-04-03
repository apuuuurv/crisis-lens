'use client'

import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    quote: 'Helped me avoid a flooded road during heavy rain. The alert showed the exact route to skip before I left the dorm.',
    name: 'Aarav',
    role: 'Student commuter',
  },
  {
    quote: 'Our student support team could see congestion build near the science block and message affected groups immediately.',
    name: 'Nina',
    role: 'Operations lead',
  },
  {
    quote: 'The interface feels trustworthy because it combines community reports with a clear severity signal instead of noise.',
    name: 'Rehan',
    role: 'Resident assistant',
  },
]

export function TestimonialSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-[min(1200px,calc(100%-1.5rem))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge className="rounded-full border border-border/60 bg-background/60 px-4 py-1">
            Testimonials
          </Badge>
          <h2 className="mt-4 font-[family:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Real scenarios, handled with better awareness
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
            >
              <Card className="h-full rounded-[32px] border-border/60 bg-background/75 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                <CardContent className="p-7">
                  <div className="flex items-center justify-between">
                    <Quote className="size-8 text-emerald-500" />
                    <div className="flex gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} className="size-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-6 text-base leading-8 text-foreground">“{testimonial.quote}”</p>
                  <div className="mt-8">
                    <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
