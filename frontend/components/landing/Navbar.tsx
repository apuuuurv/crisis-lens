'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'

interface NavbarProps {
  isAuthenticated: boolean
}

const navItems = [
  { href: '#home', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it Works' },
]

export function Navbar({ isAuthenticated }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled && 'backdrop-blur-2xl',
      )}
    >
      <div
        className={cn(
          'mx-auto mt-3 flex w-[min(1200px,calc(100%-1.5rem))] items-center justify-between rounded-full border px-4 py-3 transition-all duration-300 md:px-6',
          scrolled
            ? 'border-border/70 bg-background/85 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.55)]'
            : 'border-transparent bg-transparent',
        )}
      >
        <Link href="#home" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-lime-500 text-black shadow-lg shadow-emerald-500/30">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-[family:var(--font-display)] text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Crisis Lens
            </span>
            <span className="text-sm font-medium text-foreground">Incident awareness, in real time</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button asChild variant="ghost" className="rounded-full px-5">
            <Link href="/login">Login</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 px-5 text-black shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:via-emerald-300 hover:to-lime-300"
          >
            <Link href={isAuthenticated ? '/dashboard' : '/register'}>Sign Up</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="border-l-border/60 bg-background/95 backdrop-blur-2xl">
              <SheetHeader>
                <SheetTitle className="font-[family:var(--font-display)]">Crisis Lens</SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-3 px-4 pb-6">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-2xl border border-border/60 px-4 py-3 text-sm font-medium text-foreground"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                {isAuthenticated ? (
                  <SheetClose asChild>
                    <Link
                      href="/dashboard"
                      className="rounded-2xl border border-border/60 px-4 py-3 text-sm font-medium text-foreground"
                    >
                      Dashboard
                    </Link>
                  </SheetClose>
                ) : null}
                <div className="mt-4 grid gap-3">
                  <SheetClose asChild>
                    <Button asChild variant="ghost" className="h-11 rounded-full">
                      <Link href="/login">Login</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      asChild
                      className="h-11 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 text-black"
                    >
                      <Link href={isAuthenticated ? '/dashboard' : '/register'}>Sign Up</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
