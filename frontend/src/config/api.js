// API configuration
// Uses environment variables for production flexibility
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    signup: `${API_BASE_URL}/auth/signup`,
    me: `${API_BASE_URL}/auth/me`,
  },
  profile: {
    seeker: {
      get: `${API_BASE_URL}/profile/seeker`,
      update: `${API_BASE_URL}/profile/seeker`,
      downloadCV: `${API_BASE_URL}/profile/seeker/download-cv`,
      downloadApplicantCV: (userId) => `${API_BASE_URL}/profile/seeker/${userId}/download-cv`,
      getPublic: (id) => `${API_BASE_URL}/profile/seeker/${id}`,
      addSkill: `${API_BASE_URL}/profile/seeker/skills`,
      removeSkill: (skill) => `${API_BASE_URL}/profile/seeker/skills/${encodeURIComponent(skill)}`,
      addExperience: `${API_BASE_URL}/profile/seeker/experience`,
      updateExperience: (id) => `${API_BASE_URL}/profile/seeker/experience/${id}`,
      deleteExperience: (id) => `${API_BASE_URL}/profile/seeker/experience/${id}`,
      addEducation: `${API_BASE_URL}/profile/seeker/education`,
      updateEducation: (id) => `${API_BASE_URL}/profile/seeker/education/${id}`,
      deleteEducation: (id) => `${API_BASE_URL}/profile/seeker/education/${id}`,
    },
    company: {
      get: `${API_BASE_URL}/profile/company`,
      update: `${API_BASE_URL}/profile/company`,
      getPublic: (id) => `${API_BASE_URL}/profile/company/${id}`,
    },
  },
  jobs: {
    list: `${API_BASE_URL}/jobs`,
    get: (id) => `${API_BASE_URL}/jobs/${id}`,
    create: `${API_BASE_URL}/jobs`,
    update: (id) => `${API_BASE_URL}/jobs/${id}`,
    delete: (id) => `${API_BASE_URL}/jobs/${id}`,
    myJobs: `${API_BASE_URL}/jobs/company/my-jobs`,
  },
  applications: {
    apply: `${API_BASE_URL}/applications`,
    myApplications: `${API_BASE_URL}/applications/my-applications`,
    forJob: (jobId) => `${API_BASE_URL}/applications/job/${jobId}`,
    updateStatus: (id) => `${API_BASE_URL}/applications/${id}/status`,
    withdraw: (id) => `${API_BASE_URL}/applications/${id}`,
    callForInterview: (id) => `${API_BASE_URL}/applications/${id}/call-for-interview`,
    bulkEmail: (jobId) => `${API_BASE_URL}/applications/job/${jobId}/bulk-email`,
  },
  dashboard: {
    stats: `${API_BASE_URL}/dashboard/stats`,
    activity: `${API_BASE_URL}/dashboard/activity`,
  },
  admin: {
    seekers: `${API_BASE_URL}/admin/seekers`,
    companies: `${API_BASE_URL}/admin/companies`,
    deleteSeeker: (id) => `${API_BASE_URL}/admin/seekers/${id}`,
    deleteCompany: (id) => `${API_BASE_URL}/admin/companies/${id}`,
    users: `${API_BASE_URL}/admin/users`,
    updateUserRole: (id) => `${API_BASE_URL}/admin/users/${id}/role`,
    deleteUser: (id) => `${API_BASE_URL}/admin/users/${id}`,
  },
  wishlist: {
    list: `${API_BASE_URL}/wishlist`,
    add: `${API_BASE_URL}/wishlist`,
    remove: (jobId) => `${API_BASE_URL}/wishlist/${jobId}`,
    check: (jobId) => `${API_BASE_URL}/wishlist/check/${jobId}`,
  },
}

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default API_BASE_URL
