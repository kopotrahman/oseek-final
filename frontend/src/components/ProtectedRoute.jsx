import { useState, useEffect } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { API_ENDPOINTS, getAuthHeaders } from "../config/api"

export default function ProtectedRoute() {
  const [loading, setLoading] = useState(true)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token")
      
      if (!token) {
        setLoading(false)
        setIsValid(false)
        return
      }

      try {
        const response = await fetch(API_ENDPOINTS.auth.me, {
          headers: getAuthHeaders(),
        })

        if (response.ok) {
          const user = await response.json()
          // Update stored user data in case it changed
          localStorage.setItem("user", JSON.stringify(user))
          setIsValid(true)
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          setIsValid(false)
        }
      } catch {
        // Network error - allow access with existing token (offline mode)
        setIsValid(true)
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f1e] via-[#1a1a2e] to-[#0f0f1e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0066ff]"></div>
      </div>
    )
  }

  if (!isValid) {
    return <Navigate to="/auth/login" replace />
  }

  return <Outlet />
}
