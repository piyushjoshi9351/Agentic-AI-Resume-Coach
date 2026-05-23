export const AUTH_TOKEN_KEY = 'auth_token'
export const LATEST_ANALYSIS_KEY = 'latest_analysis_result'
export const LATEST_ANALYSIS_ID_KEY = 'latest_analysis_id'

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

export const setAuthTokenStorage = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

export const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export const setLatestAnalysis = (analysis) => {
  if (!analysis) return
  localStorage.setItem(LATEST_ANALYSIS_KEY, JSON.stringify(analysis))
  if (analysis.analysis_id != null) {
    localStorage.setItem(LATEST_ANALYSIS_ID_KEY, String(analysis.analysis_id))
  }
}

export const getLatestAnalysis = () => {
  const raw = localStorage.getItem(LATEST_ANALYSIS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const getLatestAnalysisId = () => localStorage.getItem(LATEST_ANALYSIS_ID_KEY)

export const clearLatestAnalysis = () => {
  localStorage.removeItem(LATEST_ANALYSIS_KEY)
  localStorage.removeItem(LATEST_ANALYSIS_ID_KEY)
}