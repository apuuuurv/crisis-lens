"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { ok, data, error: apiError } = await apiClient.login(email, password)
      if (ok) {
        const role = data?.role || "citizen"
        if (role === "admin") {
          router.push("/dashboard")
        } else {
          router.push("/report")
        }
      } else {
        // Handle 422 error objects from FastAPI
        const errorMessage = Array.isArray(apiError) 
          ? apiError.map(e => e.msg).join(", ") 
          : typeof apiError === "string" 
            ? apiError 
            : "Invalid credentials"
        setError(errorMessage)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] selection:bg-red-500/30 selection:text-red-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] bg-red-900/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[10%] w-[70%] h-[70%] bg-zinc-900/40 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4 z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">CrisisLens Admin</h1>
          <p className="text-zinc-400 mt-2">Secure access for response coordinators</p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-zinc-100 px-1">Welcome back</CardTitle>
            <CardDescription className="text-zinc-500 px-1">
              Enter your credentials to access the command center
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@crisislens.com"
                    required
                    className="bg-zinc-950/50 border-zinc-800 text-zinc-200 pl-10 focus:ring-red-500/20 focus:border-red-500/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-400">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <Input
                    id="password"
                    type="password"
                    required
                    className="bg-zinc-950/50 border-zinc-800 text-zinc-200 pl-10 focus:ring-red-500/20 focus:border-red-500/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-2">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-medium h-11 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-zinc-500">
                Don't have an account?{" "}
                <Link href="/register" className="text-red-500 hover:text-red-400 font-medium transition-colors">
                  Request Access
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
