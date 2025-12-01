import { useState, useEffect, useCallback, useRef } from "react"
import Header from "../components/Header"
import { API_ENDPOINTS, getAuthHeaders } from "../config/api"
import { MapPin, Briefcase, DollarSign, Clock } from "lucide-react"

export default function Jobs() {
  const [q, setQ] = useState("")
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [applying, setApplying] = useState(null)
  const [applySuccess, setApplySuccess] = useState("")
  const [page, setPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState({ pages: 1, total: 0 })
  
  // Refs for timeout cleanup
  const successTimeoutRef = useRef(null)
  const errorTimeoutRef = useRef(null)

  const user = JSON.parse(localStorage.getItem("user") || "null")
  const isSeeker = user?.role === "seeker"
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  const fetchJobs = useCallback(async (searchQuery, currentPage) => {
    setLoading(true)
    setError("")
    try {
      const url = new URL(API_ENDPOINTS.jobs.list)
      if (searchQuery) url.searchParams.append("q", searchQuery)
      url.searchParams.append("page", currentPage)
      url.searchParams.append("limit", 10)

      const response = await fetch(url.toString(), { headers: getAuthHeaders() })
      const data = await response.json()

      if (response.ok) {
        setJobs(data.jobs || [])
        setPaginationInfo({ pages: data.pagination?.pages || 1, total: data.pagination?.total || 0 })
      } else {
        setError(data.message || "Failed to fetch jobs")
      }
    } catch (err) {
      console.error("Fetch jobs error:", err)
      setError("Network error. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs(q, page)
  }, [q, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = async (jobId) => {
    if (!user) {
      window.location.href = "/auth/login?role=seeker"
      return
    }

    if (!isSeeker) {
      setError("Only job seekers can apply for jobs")
      return
    }

    setApplying(jobId)
    setApplySuccess("")
    try {
      const response = await fetch(API_ENDPOINTS.applications.apply, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ jobId }),
      })
      const data = await response.json()

      if (response.ok) {
        setApplySuccess(`Successfully applied to this job!`)
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = setTimeout(() => setApplySuccess(""), 3000)
      } else {
        setError(data.message || "Failed to apply")
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
        errorTimeoutRef.current = setTimeout(() => setError(""), 3000)
      }
    } catch (err) {
      console.error("Apply error:", err)
      setError("Network error. Please try again later.")
    } finally {
      setApplying(null)
    }
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < paginationInfo.pages) {
      setPage(page + 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1e] via-[#1a1a2e] to-[#0f0f1e]">
      <Header />

      <div className="max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-[#e0e0ff] mb-6">Find Jobs</h1>

        <div className="mb-8">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1) // Reset to first page on search
            }}
            placeholder="Search jobs, companies, or locations"
            className="w-full max-w-xl px-4 py-3 rounded-lg bg-[#16213e] border border-[#2d2d4d] text-[#e0e0ff] placeholder-[#9aa1b3] focus:outline-none focus:border-[#0066ff]"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {applySuccess && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
            {applySuccess}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0066ff]"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.length ? (
              jobs.map((job) => (
                <div key={job._id} className="bg-[#16213e] border border-[#2d2d4d] rounded-xl p-6 neon-glow hover:border-[#0066ff] transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-[#e0e0ff]">{job.title}</h2>
                      <p className="text-[#00d9ff] font-medium">{job.companyName}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-[#a0a0c0] text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase size={14} /> {job.type}
                        </span>
                        {job.salary?.min && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={14} /> {job.salary?.min?.toLocaleString()} - {job.salary?.max?.toLocaleString()} {job.salary?.currency || "USD"}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {job.experience || "Any experience"}
                        </span>
                      </div>
                      {job.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {job.skills.slice(0, 5).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-[#0066ff]/20 text-[#0066ff] rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {isSeeker || !user ? (
                        <button
                          onClick={() => handleApply(job._id)}
                          disabled={applying === job._id}
                          className="px-4 py-2 bg-[#0066ff] text-white rounded-lg font-semibold hover:bg-[#0052cc] transition disabled:opacity-50"
                        >
                          {applying === job._id ? "Applying..." : "Apply"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#a0a0c0]">No jobs found</p>
            )}
          </div>
        )}

        {paginationInfo.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="px-4 py-2 bg-[#16213e] border border-[#2d2d4d] text-[#e0e0ff] rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-[#a0a0c0]">
              Page {page} of {paginationInfo.pages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page === paginationInfo.pages}
              className="px-4 py-2 bg-[#16213e] border border-[#2d2d4d] text-[#e0e0ff] rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
