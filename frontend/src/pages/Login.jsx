"use client"

import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, Github, Mail } from "lucide-react"
import Header from "../components/Header"

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const role = searchParams.get("role") || "seeker"

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        navigate(role === "seeker" ? "/profile/seeker" : "/profile/company")
      }
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1e] via-[#1a1a2e] to-[#0f0f1e]">
      <Header />
      <div className="flex items-center justify-center py-20 px-4">
        <div className="bg-[#16213e] border border-[#2d2d4d] rounded-2xl p-8 max-w-md w-full neon-glow">
          <h1 className="text-3xl font-bold mb-2 text-[#e0e0ff]">Welcome Back</h1>
          <p className="text-[#a0a0c0] mb-8">Sign in to your {role === "seeker" ? "job seeker" : "company"} account</p>

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-[#a0a0c0] mb-2 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] placeholder-[#6d6d8f] focus:border-[#0066ff] focus:outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-[#a0a0c0] mb-2 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] placeholder-[#6d6d8f] focus:border-[#0066ff] focus:outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0c0] hover:text-[#00d9ff]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0066ff] text-white rounded-lg py-2 font-semibold hover:bg-[#0052cc] transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2d2d4d]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#16213e] text-[#a0a0c0]">Or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg py-2 flex items-center justify-center gap-2 text-[#e0e0ff] hover:border-[#0066ff] transition">
              <Mail size={20} /> Google
            </button>
            <button className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg py-2 flex items-center justify-center gap-2 text-[#e0e0ff] hover:border-[#0066ff] transition">
              <Github size={20} /> LinkedIn
            </button>
          </div>

          <p className="text-center text-[#a0a0c0] mt-8">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/auth/signup?role=" + role)}
              className="text-[#0066ff] hover:text-[#00d9ff] font-semibold"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
