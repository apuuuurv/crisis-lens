"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { ok, error: apiError } = await apiClient.login(email, password)

      if (ok) {
        router.push("/dashboard")
        return
      }

      const errorMessage = Array.isArray(apiError)
        ? apiError.map((item) => item.msg).join(", ")
        : typeof apiError === "string"
          ? apiError
          : "Invalid credentials"

      setError(errorMessage)
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030507] px-4 selection:bg-emerald-500/30 selection:text-emerald-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[35%] h-[70%] w-[70%] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[10%] h-[70%] w-[70%] rounded-full bg-zinc-900/50 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <Shield className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Crisis Lens</h1>
          <p className="mt-2 text-zinc-400">Sign in to access live awareness, alerts, and reporting.</p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/60 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="px-1 text-xl text-zinc-100">Welcome back</CardTitle>
            <CardDescription className="px-1 text-zinc-500">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="border-zinc-800 bg-zinc-950/50 pl-10 text-zinc-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-400">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="border-zinc-800 bg-zinc-950/50 pl-10 text-zinc-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="mt-2 flex flex-col gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-emerald-500 font-medium text-black transition-all hover:bg-emerald-400"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-zinc-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-emerald-400 transition-colors hover:text-emerald-300">
                  Create one
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
