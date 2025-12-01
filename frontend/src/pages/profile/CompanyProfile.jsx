"use client"

import { useState } from "react"
import Header from "../../components/Header"

export default function CompanyProfile() {
  const [profile, setProfile] = useState({
    companyName: "Tech Innovations Inc",
    email: "hr@techinnovations.com",
    website: "www.techinnovations.com",
    location: "San Francisco, CA",
    description: "A leading software development company",
    industry: "Technology",
    size: "100-500",
    founded: "2015",
  })

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1e] via-[#1a1a2e] to-[#0f0f1e]">
      <Header />
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-[#16213e] border border-[#2d2d4d] rounded-2xl p-8 neon-glow">
          <h1 className="text-4xl font-bold text-[#e0e0ff] mb-8">Company Profile</h1>

          <div className="bg-[#0f0f1e] rounded-lg p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={profile.companyName}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Website</label>
                <input
                  type="text"
                  name="website"
                  value={profile.website}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Location</label>
                <input
                  type="text"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#a0a0c0] mb-2 font-medium">Description</label>
              <textarea
                name="description"
                value={profile.description}
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
                  value={profile.industry}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Company Size</label>
                <input
                  type="text"
                  name="size"
                  value={profile.size}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Founded Year</label>
                <input
                  type="text"
                  name="founded"
                  value={profile.founded}
                  onChange={handleChange}
                  className="w-full bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <button className="w-full bg-[#0066ff] text-white rounded-lg py-2 font-semibold hover:bg-[#0052cc] transition">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
