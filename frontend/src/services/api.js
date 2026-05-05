import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout for analysis
})

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export const registerUser = async ({ name, email, password }) => {
  const response = await api.post('/auth/register', { name, email, password })
  return response.data
}

export const loginUser = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

export const getHistory = async () => {
  const response = await api.get('/history')
  return response.data
}

export const getAnalyticsSummary = async () => {
  const response = await api.get('/analytics/summary')
  return response.data
}

export const deleteHistoryItem = async (historyId) => {
  await api.delete(`/history/${historyId}`)
}

/**
 * Call the AI Resume Coach API to analyze resume and job description
 * @param {File} resumePdf - Resume PDF file
 * @param {string} jobDescription - Job description text
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeResume = async (resumePdf, jobDescription, jobUrl = '') => {
  try {
    const formData = new FormData()
    formData.append('resume', resumePdf)
    if (jobDescription && jobDescription.trim()) {
      formData.append('job_description', jobDescription)
    }
    if (jobUrl && jobUrl.trim()) {
      formData.append('job_url', jobUrl)
    }

    const response = await api.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    let errorMessage = 'An error occurred during analysis'
    
    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.detail || error.response.statusText
    } else if (error.request) {
      // Request made but no response
      errorMessage = `No response from server. Is the backend running on ${API_BASE_URL}?`
    } else if (error.message === 'Network Error') {
      errorMessage = 'Network error. Please check your connection.'
    }
    
    return {
      success: false,
      error: errorMessage,
    }
  }
}

export const parseJobUrl = async (url) => {
  try {
    const response = await api.post('/job/parse', { url })
    return { success: true, data: response.data }
  } catch (error) {
    const errorMessage = error.response?.data?.detail || 'Failed to parse job URL'
    return { success: false, error: errorMessage }
  }
}

export const downloadReport = async (analysisId) => {
  const response = await api.get(`/export/${analysisId}`, {
    responseType: 'blob',
  })
  return response.data
}

/**
 * Check if the API is healthy
 * @returns {Promise<boolean>} True if API is healthy
 */
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 })
    return response.data?.status === 'healthy'
  } catch {
    return false
  }
}

  // Resume Improvement
  export const improveResume = async (analysisId) => {
    try {
      const response = await api.post('/resume/improve', { analysis_id: analysisId })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to improve resume' }
    }
  }

  export const getResumeDiff = async (analysisId) => {
    try {
      const response = await api.get(`/resume/${analysisId}/diff`)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to get diff' }
    }
  }

  // Job Tracker
  export const createJobApplication = async (company, role, status = 'applied', jobUrl = '', notes = '') => {
    try {
      const response = await api.post('/jobs', { company, role, status, job_url: jobUrl, notes })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to create job application' }
    }
  }

  export const getJobApplications = async (status = null) => {
    try {
      const params = status ? { status } : {}
      const response = await api.get('/jobs', { params })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch jobs' }
    }
  }

  export const updateJobApplication = async (jobId, company, role, status, jobUrl = '', notes = '') => {
    try {
      const response = await api.put(`/jobs/${jobId}`, { company, role, status, job_url: jobUrl, notes })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to update job application' }
    }
  }

  export const deleteJobApplication = async (jobId) => {
    try {
      await api.delete(`/jobs/${jobId}`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to delete job application' }
    }
  }

  // Email Generation
  export const generateFollowUpEmail = async (company, role, context = '') => {
    try {
      const response = await api.post('/email/follow-up', { company, role, context })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to generate email' }
    }
  }

  // Interview Analysis
  export const analyzeInterviewAnswer = async (question, answer) => {
    try {
      const response = await api.post('/interview/analyze', { question, answer })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to analyze answer' }
    }
  }

  // User Profile
  export const updateUserProfile = async (experienceLevel, targetRole, location, salaryRange, language = 'en') => {
    try {
      const response = await api.post('/profile', {
        experience_level: experienceLevel,
        target_role: targetRole,
        location,
        salary_range: salaryRange,
        language,
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to update profile' }
    }
  }

  export const getUserProfile = async () => {
    try {
      const response = await api.get('/profile')
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to get profile' }
    }
  }

  // Task Tracking
  export const getTaskStatus = async (taskId) => {
    try {
      const response = await api.get(`/task/${taskId}`)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to get task status' }
    }
  }

export default api
