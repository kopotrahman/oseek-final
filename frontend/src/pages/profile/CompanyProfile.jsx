import { useState, useEffect, useRef } from "react"
import Header from "../../components/Header"
import { API_ENDPOINTS, getAuthHeaders } from "../../config/api"

export default function CompanyProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Ref for timeout cleanup
  const timeoutRef = useRef(null)
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.profile.company.get, {
        headers: getAuthHeaders(),
      })
      const data = await response.json()

      if (response.ok) {
        setProfile(data)
      } else {
        setError(data.message || "Failed to fetch profile")
      }
    } catch (err) {
      console.error("Fetch profile error:", err)
      setError("Network error. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const response = await fetch(API_ENDPOINTS.profile.company.update, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(profile),
      })
      const data = await response.json()

      if (response.ok) {
        setProfile(data)
        setSuccess("Profile updated successfully!")
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.message || "Failed to update profile")
      }
    } catch (err) {
      console.error("Update profile error:", err)
      setError("Network error. Please try again later.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f1e] via-[#1a1a2e] to-[#0f0f1e]">
        <Header />
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0066ff]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1e] via-[#1a1a2e] to-[#0f0f1e]">
      <Header />
      <div className="max-w-4xl mx-auto py-12 px-4">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        <div className="bg-[#16213e] border border-[#2d2d4d] rounded-2xl p-8 neon-glow">
          <h1 className="text-4xl font-bold text-[#e0e0ff] mb-8">Company Profile</h1>

          <div className="bg-[#0f0f1e] rounded-lg p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={profile?.companyName || ""}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#a0a0c0] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Website</label>
                <input
                  type="text"
                  name="website"
                  value={profile?.website || ""}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Location</label>
                <input
                  type="text"
                  name="location"
                  value={profile?.location || ""}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#a0a0c0] mb-2 font-medium">Description</label>
              <textarea
                name="description"
                value={profile?.description || ""}
                onChange={handleChange}
                rows="4"
                className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={profile?.industry || ""}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Company Size</label>
                <input
                  type="text"
                  name="size"
                  value={profile?.size || ""}
                  onChange={handleChange}
                  placeholder="e.g., 100-500"
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] placeholder-[#6d6d8f] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Founded Year</label>
                <input
                  type="text"
                  name="founded"
                  value={profile?.founded || ""}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#0066ff] text-white rounded-lg py-2 font-semibold hover:bg-[#0052cc] transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
