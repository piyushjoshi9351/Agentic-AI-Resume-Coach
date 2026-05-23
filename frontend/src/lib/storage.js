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

export const SAVED_ANALYSES_KEY = 'saved_analyses'

export const getSavedAnalyses = () => {
  const raw = localStorage.getItem(SAVED_ANALYSES_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const setSavedAnalyses = (arr = []) => {
  try {
    localStorage.setItem(SAVED_ANALYSES_KEY, JSON.stringify(arr))
  } catch {
    // ignore quota errors
  }
}

export const addSavedAnalysis = (analysis) => {
  if (!analysis) return
  const list = getSavedAnalyses()
  // normalize an id for local items
  const id = analysis.analysis_id != null ? String(analysis.analysis_id) : `local-${Date.now()}`
  const item = {
    id,
    analysis_id: analysis.analysis_id ?? null,
    created_at: analysis.created_at || new Date().toISOString(),
    resume_filename: analysis.resume_filename || analysis.filename || 'resume.pdf',
    resume_analysis: analysis.resume_analysis || {},
    job_match: analysis.job_match || {},
    raw: analysis,
  }
  // prepend newest
  list.unshift(item)
  // keep last 50
  setSavedAnalyses(list.slice(0, 50))
  try {
    window.dispatchEvent(new CustomEvent('saved-analyses-changed', { detail: item }))
  } catch {
    // ignore
  }
}

export const removeSavedAnalysis = (id) => {
  const list = getSavedAnalyses().filter((i) => String(i.id) !== String(id))
  setSavedAnalyses(list)
}
