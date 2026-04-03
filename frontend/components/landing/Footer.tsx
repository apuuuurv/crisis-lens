'use client'

import Link from 'next/link'
import { Github, Instagram, Linkedin, ShieldCheck } from 'lucide-react'

const footerLinks = [
  { href: '#home', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it Works' },
  { href: '/login', label: 'Login' },
  { href: '/register', label: 'Sign Up' },
]

const socials = [
  { href: 'https://github.com', label: 'GitHub', icon: Github },
  { href: 'https://linkedin.com', label: 'LinkedIn', icon: Linkedin },
  { href: 'https://instagram.com', label: 'Instagram', icon: Instagram },
]

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex w-[min(1200px,calc(100%-1.5rem))] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-emerald-400 to-lime-400 text-black">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="font-[family:var(--font-display)] text-lg font-semibold text-foreground">Crisis Lens</p>
              <p className="text-sm text-muted-foreground">Real-time incident awareness and safety visibility.</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            © 2026 Crisis Lens. All rights reserved.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:gap-10">
          <div className="flex flex-wrap gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {socials.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground"
              >
                <social.icon className="size-4" />
                <span className="sr-only">{social.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
