"use client"

import { useState, useEffect } from "react"
import Header from "../components/Header"

export default function Jobs() {
  const [q, setQ] = useState("")
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    // placeholder: fetch jobs from a backend API when available
    const sample = [
      { id: 1, title: "Frontend Engineer", company: "Acme Inc", location: "Remote" },
      { id: 2, title: "Backend Engineer", company: "Acme Inc", location: "Remote" },
      { id: 3, title: "Product Designer", company: "Designly", location: "New York, NY" },
    ]
    setJobs(sample)
  }, [])

  const filtered = jobs.filter((j) => (q ? (j.title + j.company + j.location).toLowerCase().includes(q.toLowerCase()) : true))

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1e] via-[#1a1a2e] to-[#0f0f1e]">
      <Header />

      <div className="max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-[#e0e0ff] mb-6">Find Jobs</h1>

        <div className="mb-8">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jobs, companies, or locations"
            className="w-full max-w-xl px-4 py-3 rounded-lg bg-[#16213e] border border-[#2d2d4d] text-[#e0e0ff] placeholder-[#9aa1b3] focus:outline-none focus:border-[#0066ff]"
          />
        </div>

        <div className="grid gap-4">
          {filtered.length ? (
            filtered.map((job) => (
              <div key={job.id} className="bg-[#16213e] border border-[#2d2d4d] rounded-xl p-6 neon-glow hover:border-[#0066ff] transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-[#e0e0ff]">{job.title}</h2>
                    <p className="text-[#a0a0c0]">{job.company} • {job.location}</p>
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-[#0066ff] text-white rounded-lg font-semibold hover:bg-[#0052cc] transition">Apply</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[#a0a0c0]">No jobs found</p>
          )}
        </div>
      </div>
    </div>
  )
}
