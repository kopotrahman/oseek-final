import { Navigate, Outlet } from "react-router-dom"

export default function ProtectedRoute() {
  // simple token-based guard (matches project pattern)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  if (!token) {
    return <Navigate to="/auth/login" replace />
  }

  return <Outlet />
}
