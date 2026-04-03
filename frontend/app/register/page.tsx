"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "citizen",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: string, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { ok, error: apiError } = await apiClient.register(formData)

      if (ok) {
        router.push("/login?registered=true")
        return
      }

      setError(typeof apiError === "string" ? apiError : "Registration failed")
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030507] px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-[10%] -top-[35%] h-[70%] w-[70%] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute -bottom-[40%] -left-[10%] h-[70%] w-[70%] rounded-full bg-zinc-900/50 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <Shield className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Crisis Lens Account</h1>
          <p className="mt-2 text-zinc-400">Create access to live alerts, dashboard awareness, and incident reporting.</p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/60 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl text-zinc-100">Create account</CardTitle>
            <CardDescription className="text-zinc-500">Enter your information to get started</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-400">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                    <Input
                      id="name"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(event) => handleChange("name", event.target.value)}
                      className="h-10 border-zinc-800 bg-zinc-950/50 pl-10 text-zinc-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-zinc-400">
                    Account Type
                  </Label>
                  <Select defaultValue="citizen" onValueChange={(value) => handleChange("role", value)}>
                    <SelectTrigger className="h-10 border-zinc-800 bg-zinc-950/50 text-zinc-200 focus:border-emerald-500/50 focus:ring-emerald-500/20">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-200">
                      <SelectItem value="citizen">Citizen Observer</SelectItem>
                      <SelectItem value="responder">Responder / Official</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    className="h-10 border-zinc-800 bg-zinc-950/50 pl-10 text-zinc-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
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
                    placeholder="********"
                    value={formData.password}
                    onChange={(event) => handleChange("password", event.target.value)}
                    className="h-10 border-zinc-800 bg-zinc-950/50 pl-10 text-zinc-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
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
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-center text-sm font-normal text-zinc-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-emerald-400 transition-colors hover:text-emerald-300">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
