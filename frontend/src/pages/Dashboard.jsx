"use client"

import { useNavigate } from "react-router-dom"
import Header from "../components/Header"
import { BarChart3, Users, FileText, Settings } from "lucide-react"

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1e] via-[#1a1a2e] to-[#0f0f1e]">
      <Header />
      <div className="max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-[#e0e0ff] mb-8">Dashboard</h1>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: <FileText size={32} />, label: "Profile Views", value: "1,234" },
            { icon: <Users size={32} />, label: "Connections", value: "45" },
            { icon: <BarChart3 size={32} />, label: "Applications", value: "12" },
            { icon: <Settings size={32} />, label: "Settings", value: "Configure" },
          ].map((card, idx) => (
            <div
              key={idx}
              className="bg-[#16213e] border border-[#2d2d4d] rounded-xl p-6 neon-glow hover:border-[#0066ff] transition"
            >
              <div className="text-[#00d9ff] mb-4">{card.icon}</div>
              <p className="text-[#a0a0c0] text-sm font-medium">{card.label}</p>
              <p className="text-[#e0e0ff] text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#16213e] border border-[#2d2d4d] rounded-2xl p-8 neon-glow">
            <h2 className="text-2xl font-bold text-[#e0e0ff] mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate(user.role === "seeker" ? "/profile/seeker" : "/profile/company")}
                className="w-full px-4 py-3 bg-[#0066ff] text-white rounded-lg font-semibold hover:bg-[#0052cc] transition"
              >
                {user.role === "seeker" ? "Update Profile" : "Manage Company"}
              </button>
              <button
                onClick={() => navigate('/jobs')}
                className="w-full px-4 py-3 bg-[#16213e] border border-[#2d2d4d] text-[#e0e0ff] rounded-lg font-semibold hover:border-[#0066ff] transition"
              >
                {user.role === "seeker" ? "Browse Jobs" : "Post Job"}
              </button>
            </div>
          </div>

          <div className="bg-[#16213e] border border-[#2d2d4d] rounded-2xl p-8 neon-glow">
            <h2 className="text-2xl font-bold text-[#e0e0ff] mb-6">Recent Activity</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-[#0066ff] pl-4">
                <p className="text-[#e0e0ff] font-semibold">Profile Updated</p>
                <p className="text-[#a0a0c0] text-sm">2 hours ago</p>
              </div>
              <div className="border-l-4 border-[#00d9ff] pl-4">
                <p className="text-[#e0e0ff] font-semibold">Application Received</p>
                <p className="text-[#a0a0c0] text-sm">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
