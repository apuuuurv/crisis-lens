"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, User, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { ok, error: apiError } = await apiClient.register(formData)
      if (ok) {
        router.push("/login?registered=true")
      } else {
        setError(apiError || "Registration failed")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[10%] w-[70%] h-[70%] bg-red-900/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[40%] -left-[10%] w-[70%] h-[70%] bg-zinc-900/40 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg px-4 z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">CrisisLens Account</h1>
          <p className="text-zinc-400 mt-2">Join the disaster response network</p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl text-zinc-100">Create account</CardTitle>
            <CardDescription className="text-zinc-500">
              Enter your information to get started
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-400">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      required
                      className="bg-zinc-950/50 border-zinc-800 text-zinc-200 pl-10 focus:ring-red-500/20 focus:border-red-500/50 h-10"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-zinc-400">Account Type</Label>
                  <Select 
                    onValueChange={(val) => handleChange("role", val)} 
                    defaultValue="citizen"
                  >
                    <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-zinc-200 focus:ring-red-500/20 focus:border-red-500/50 h-10">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                      <SelectItem value="citizen">Citizen Observer</SelectItem>
                      <SelectItem value="responder">Responder / Official</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@crisislens.com"
                    required
                    className="bg-zinc-950/50 border-zinc-800 text-zinc-200 pl-10 focus:ring-red-500/20 focus:border-red-500/50 h-10"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-400">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <Input
                    id="password"
                    type="password"
                    required
                    className="bg-zinc-950/50 border-zinc-800 text-zinc-200 pl-10 focus:ring-red-500/20 focus:border-red-500/50 h-10"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
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
                    Create Account <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-zinc-500 font-normal">
                Already have an account?{" "}
                <Link href="/login" className="text-red-500 hover:text-red-400 font-medium transition-colors">
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
