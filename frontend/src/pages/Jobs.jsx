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
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    location: "",
    type: "full-time",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    skills: "",
    experience: "",
  })
  const [postingJob, setPostingJob] = useState(false)
  const [jobFormError, setJobFormError] = useState("")
  const [jobFormSuccess, setJobFormSuccess] = useState("")
  const [myJobs, setMyJobs] = useState([])
  const [myJobsLoading, setMyJobsLoading] = useState(false)
  
  // Refs for timeout cleanup
  const successTimeoutRef = useRef(null)
  const errorTimeoutRef = useRef(null)

  const user = JSON.parse(localStorage.getItem("user") || "null")
  const isSeeker = user?.role === "seeker"
  const isCompany = user?.role === "company"
  
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

  const fetchMyJobs = useCallback(async () => {
    if (!isCompany) return

    setMyJobsLoading(true)
    setJobFormError("")
    try {
      const response = await fetch(API_ENDPOINTS.jobs.myJobs, { headers: getAuthHeaders() })
      const data = await response.json()

      if (response.ok) {
        setMyJobs(data || [])
      } else {
        setJobFormError(data.message || "Failed to fetch your jobs")
      }
    } catch (err) {
      console.error("Fetch my jobs error:", err)
      setJobFormError("Network error. Please try again later.")
    } finally {
      setMyJobsLoading(false)
    }
  }, [isCompany])

  useEffect(() => {
    fetchJobs(q, page)
  }, [q, page]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMyJobs()
  }, [fetchMyJobs])

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

  const handleCreateJob = async (e) => {
    e.preventDefault()
    setJobFormError("")
    setJobFormSuccess("")

    if (!newJob.title.trim() || !newJob.description.trim() || !newJob.location.trim()) {
      setJobFormError("Title, description, and location are required")
      return
    }

    const salary =
      newJob.salaryMin || newJob.salaryMax
        ? {
            min: newJob.salaryMin ? Number(newJob.salaryMin) : undefined,
            max: newJob.salaryMax ? Number(newJob.salaryMax) : undefined,
            currency: newJob.salaryCurrency || "USD",
          }
        : undefined

    const payload = {
      title: newJob.title.trim(),
      description: newJob.description.trim(),
      location: newJob.location.trim(),
      type: newJob.type,
      experience: newJob.experience || undefined,
      salary,
      skills: newJob.skills
        ? newJob.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
        : [],
    }

    setPostingJob(true)
    try {
      const response = await fetch(API_ENDPOINTS.jobs.create, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (response.ok) {
        setJobFormSuccess("Job posted successfully!")
        setNewJob({
          title: "",
          description: "",
          location: "",
          type: "full-time",
          salaryMin: "",
          salaryMax: "",
          salaryCurrency: "USD",
          skills: "",
          experience: "",
        })
        fetchMyJobs()
      } else {
        setJobFormError(data.message || "Failed to post job")
      }
    } catch (err) {
      console.error("Create job error:", err)
      setJobFormError("Network error. Please try again later.")
    } finally {
      setPostingJob(false)
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

        {isCompany && (
          <div className="mb-10 bg-[#16213e] border border-[#2d2d4d] rounded-2xl p-8 neon-glow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-[#e0e0ff]">Post a Job</h2>
              <p className="text-[#a0a0c0] text-sm">Share your open roles with seekers instantly.</p>
            </div>

            {jobFormError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {jobFormError}
              </div>
            )}
            {jobFormSuccess && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
                {jobFormSuccess}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleCreateJob}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#a0a0c0] mb-2 font-medium">Job Title *</label>
                  <input
                    type="text"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#a0a0c0] mb-2 font-medium">Location *</label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#a0a0c0] mb-2 font-medium">Type</label>
                  <select
                    value={newJob.type}
                    onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                    className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                  >
                    {["full-time", "part-time", "contract", "remote", "internship"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#a0a0c0] mb-2 font-medium">Salary Min</label>
                  <input
                    type="number"
                    value={newJob.salaryMin}
                    onChange={(e) => setNewJob({ ...newJob, salaryMin: e.target.value })}
                    className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#a0a0c0] mb-2 font-medium">Salary Max</label>
                  <input
                    type="number"
                    value={newJob.salaryMax}
                    onChange={(e) => setNewJob({ ...newJob, salaryMax: e.target.value })}
                    className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#a0a0c0] mb-2 font-medium">Currency</label>
                  <input
                    type="text"
                    value={newJob.salaryCurrency}
                    onChange={(e) => setNewJob({ ...newJob, salaryCurrency: e.target.value })}
                    className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#a0a0c0] mb-2 font-medium">Experience</label>
                  <input
                    type="text"
                    value={newJob.experience}
                    onChange={(e) => setNewJob({ ...newJob, experience: e.target.value })}
                    placeholder="e.g., 2-4 years"
                    className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#a0a0c0] mb-2 font-medium">Skills</label>
                  <input
                    type="text"
                    value={newJob.skills}
                    onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                    placeholder="e.g., React, Node, SQL"
                    className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a0a0c0] mb-2 font-medium">Description *</label>
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  rows="4"
                  className="w-full bg-[#0f0f1e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] focus:border-[#0066ff] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={postingJob}
                className="w-full bg-[#0066ff] text-white rounded-lg py-2 font-semibold hover:bg-[#0052cc] transition disabled:opacity-50"
              >
                {postingJob ? "Posting..." : "Post Job"}
              </button>
            </form>
          </div>
        )}

        {isCompany && (
          <div className="mb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-[#e0e0ff]">Your Job Listings</h2>
              <p className="text-[#a0a0c0] text-sm">
                Track your active openings and applications in one place.
              </p>
            </div>
            {myJobsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0066ff]"></div>
              </div>
            ) : myJobs.length ? (
              <div className="grid gap-4">
                {myJobs.map((job) => (
                  <div key={job._id} className="bg-[#16213e] border border-[#2d2d4d] rounded-xl p-6 neon-glow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-[#e0e0ff]">{job.title}</h3>
                        <div className="flex flex-wrap gap-3 text-[#a0a0c0] text-sm mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin size={14} /> {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase size={14} /> {job.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Date unavailable"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-[#a0a0c0]">
                        <p>
                          Status: <span className="text-[#e0e0ff] font-semibold">{job.status}</span>
                        </p>
                        <p className="mt-1">
                          Applications: <span className="text-[#e0e0ff] font-semibold">{job.applicationsCount ?? 0}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#a0a0c0]">You have not posted any jobs yet.</p>
            )}
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
