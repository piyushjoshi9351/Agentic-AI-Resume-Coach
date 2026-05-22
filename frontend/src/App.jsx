import React, { useState, useEffect } from 'react'
import { AlertCircle, Printer, X, LogOut, ChevronDown, Home, History, Settings } from 'lucide-react'
import AuthPanel from './components/AuthPanel'
import HistoryPanel from './components/HistoryPanel'
import HistoryPage from './pages/History'
import AnalyticsPanel from './components/AnalyticsPanel'
import JobParserPanel from './components/JobParserPanel'
import JobSearch from './components/JobSearch'
import ResumeUpload from './components/ResumeUpload'
import JobDescription from './components/JobDescription'
import AnalyzeButton from './components/AnalyzeButton'
import ProgressSteps from './components/ProgressSteps'
import ResultsTabs from './components/ResultsTabs'
import JobTrackerBoard from './components/JobTrackerBoard'
import ResumeImprover from './components/ResumeImprover'
import InterviewAnalyzer from './components/InterviewAnalyzer'
import EmailGenerator from './components/EmailGenerator'
import UserProfileForm from './components/UserProfileForm'
import InterviewSession from './components/interview/InterviewSession'
import {
  analyzeResume,
  checkApiHealth,
  loginUser,
  registerUser,
  getCurrentUser,
  getHistory,
  getAnalyticsSummary,
  deleteHistoryItem,
  parseJobUrl,
  searchJobs,
  downloadReport,
  setAuthToken,
  improveResume,
  getResumeDiff,
  createJobApplication,
  getJobApplications,
  updateJobApplication,
  deleteJobApplication,
  generateFollowUpEmail,
  analyzeInterviewAnswer,
  startInterviewSession,
  evaluateInterviewAnswer,
  updateUserProfile,
  getUserProfile,
  getTaskStatus,
} from './services/api'

export default function App() {
  const [resumeFile, setResumeFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [resumeError, setResumeError] = useState('')
  const [jobError, setJobError] = useState('')
  const [toast, setToast] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [activeTab, setActiveTab] = useState('analyze') // analyze, history, profile

  // Check API health on mount
  useEffect(() => {
    checkApiHealth().then((isHealthy) => {
      if (!isHealthy) {
        setApiError(
          'Backend API is not responding. Make sure the FastAPI server is running on http://localhost:8000'
        )
      }
    })
  }, [])

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      try {
        setAuthToken(token)
        const currentUser = await getCurrentUser()
        const [historyData, analyticsData] = await Promise.all([
          getHistory(),
          getAnalyticsSummary(),
        ])
        setUser(currentUser)
        setHistory(historyData)
        setAnalytics(analyticsData)
      } catch {
        localStorage.removeItem('auth_token')
        setAuthToken(null)
      }
    }

    bootstrapAuth()
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(timeout)
  }, [toast])

  const isFormValid = resumeFile && (jobDescription.trim().length >= 50 || jobUrl.trim().length > 0)

  const handleAnalyze = async ({ jobDescription: overrideJobDescription, jobUrl: overrideJobUrl } = {}) => {
    // Validate inputs
    setResumeError('')
    setJobError('')
    setError(null)

    const effectiveJobDescription = (overrideJobDescription ?? jobDescription).trim()
    const effectiveJobUrl = overrideJobUrl ?? jobUrl

    if (!resumeFile) {
      setResumeError('Please upload a resume PDF')
      return
    }

    if (effectiveJobDescription.length < 50 && !effectiveJobUrl.trim()) {
      setJobError('Job description must be at least 50 characters')
      return
    }

    setIsLoading(true)
    setResults(null)

    const response = await analyzeResume(resumeFile, effectiveJobDescription, effectiveJobUrl)

    if (response.success) {
      setResults(response.data)
      setError(null)
      if (user) {
        const [historyData, analyticsData] = await Promise.all([
          getHistory(),
          getAnalyticsSummary(),
        ])
        setHistory(historyData)
        setAnalytics(analyticsData)
      }
    } else {
      setError(response.error)
      setToast(response.error || 'API request failed. Please try again.')
    }

    setIsLoading(false)
  }

  const handleLiveJobSelected = async (job) => {
    const selectedDescription = job?.description || ''
    const selectedUrl = job?.job_url || ''

    setJobDescription(selectedDescription)
    setJobUrl(selectedUrl)
    setJobError('')
    setToast(`Selected live job: ${job?.title || 'role'}`)

    if (resumeFile && selectedDescription.trim().length >= 50) {
      await handleAnalyze({
        jobDescription: selectedDescription,
        jobUrl: selectedUrl,
      })
    }
  }

  const handleAuthLogin = async ({ email, password }) => {
    setAuthLoading(true)
    try {
      const data = await loginUser({ email, password })
      localStorage.setItem('auth_token', data.access_token)
      setAuthToken(data.access_token)
      setUser(data.user)
      const [historyData, analyticsData] = await Promise.all([
        getHistory(),
        getAnalyticsSummary(),
      ])
      setHistory(historyData)
      setAnalytics(analyticsData)
      setToast('Login successful')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleAuthRegister = async ({ name, email, password }) => {
    setAuthLoading(true)
    try {
      const data = await registerUser({ name, email, password })
      localStorage.setItem('auth_token', data.access_token)
      setAuthToken(data.access_token)
      setUser(data.user)
      setHistory([])
      setAnalytics({
        total_analyses: 0,
        avg_ats_score: 0,
        best_ats_score: 0,
        analyses_last_7_days: 0,
        top_missing_skills: [],
      })
      setToast('Account created successfully')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    setAuthToken(null)
    setUser(null)
    setHistory([])
    setAnalytics(null)
    setResults(null)
    setToast('Logged out')
  }

  const handleOpenHistoryItem = (item) => {
    setResults({
      resume_analysis: item.resume_analysis,
      job_match: item.job_match,
      cover_letter: item.cover_letter,
      interview_questions: item.interview_questions,
      analysis_id: item.id,
    })
    setActiveTab('analyze')
    setToast('Loaded saved analysis')
  }

  const handleDeleteHistoryItem = async (historyId) => {
    await deleteHistoryItem(historyId)
    setHistory((prev) => prev.filter((item) => item.id !== historyId))
    const analyticsData = await getAnalyticsSummary()
    setAnalytics(analyticsData)
  }

  const handleDownloadReport = async () => {
    if (!results?.analysis_id) return
    const blob = await downloadReport(results.analysis_id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-report-${results.analysis_id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <h1 className="text-xl font-bold text-white">Resume Coach</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <span className="text-sm text-slate-400">Welcome, <span className="text-purple-400 font-semibold">{user.name}</span></span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-pulse">
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-200">{toast}</p>
              <button onClick={() => setToast('')} className="ml-auto text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          // Login/Register View
          <div className="max-w-md mx-auto">
            <AuthPanel
              onLogin={handleAuthLogin}
              onRegister={handleAuthRegister}
              loading={authLoading}
            />
          </div>
        ) : (
          <>
            {/* API Error Alert */}
            {apiError && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-300">Backend Not Available</p>
                  <p className="text-red-200/80 mt-1">{apiError}</p>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-8 border-b border-slate-800">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('analyze')}
                  className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === 'analyze'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Home className="w-4 h-4 inline mr-2" />
                  Analyze
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === 'history'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <History className="w-4 h-4 inline mr-2" />
                  History
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === 'profile'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Profile
                </button>
              </div>
            </div>

            {/* Content Areas */}
            {activeTab === 'analyze' && (
              <div>
                {!results ? (
                  <div className="space-y-6">
                    {/* Analytics Summary */}
                    {analytics && (
                      <AnalyticsPanel analytics={analytics} />
                    )}

                    {/* Main Analysis Section */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8">
                      <h2 className="text-2xl font-bold mb-8 text-white">Resume Analysis</h2>

                      <div className="mb-8">
                        <JobSearch
                          searchJobs={searchJobs}
                          onSelectJob={handleLiveJobSelected}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <ResumeUpload
                          resumeFile={resumeFile}
                          setResumeFile={setResumeFile}
                          error={resumeError}
                          onValidationError={setResumeError}
                        />
                        <JobDescription
                          jobDescription={jobDescription}
                          setJobDescription={setJobDescription}
                          error={jobError}
                        />
                      </div>

                      <div className="mb-8">
                        <JobParserPanel
                          parseJobUrl={parseJobUrl}
                          onParsed={({ jobUrl: parsedUrl, parsedJobData: data }) => {
                            setJobUrl(parsedUrl)
                            if (data?.raw_text && jobDescription.trim().length < 50) {
                              setJobDescription(data.raw_text.slice(0, 5000))
                            }
                            setToast('Job URL parsed successfully')
                          }}
                        />
                      </div>

                      {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-4">
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-200">{error}</p>
                        </div>
                      )}

                      {isLoading && <ProgressSteps isLoading={isLoading} />}

                      {!isLoading && (
                        <AnalyzeButton
                          isLoading={isLoading}
                          isValid={resumeFile && (jobDescription.trim().length >= 50 || jobUrl.trim().length > 0) && !apiError}
                          onClick={handleAnalyze}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  // Results View
                  <div className="space-y-8">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
                        <div className="flex gap-3">
                          <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
                          >
                            <Printer className="w-4 h-4" />
                            Print
                          </button>
                          {results.analysis_id && (
                            <button
                              onClick={handleDownloadReport}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-sm font-semibold"
                            >
                              Download Report
                            </button>
                          )}
                        </div>
                      </div>
                      <ResultsTabs results={results} />
                    </div>

                    {/* Feature Sections */}
                    <div className="space-y-6">
                      <InterviewSession
                        analysisId={results.analysis_id}
                        startInterviewSession={startInterviewSession}
                        evaluateInterviewAnswer={evaluateInterviewAnswer}
                      />
                      <ResumeImprover
                        analysisId={results.analysis_id}
                        improveResume={improveResume}
                        getResumeDiff={getResumeDiff}
                      />
                      <JobTrackerBoard
                        getJobApplications={getJobApplications}
                        createJobApplication={createJobApplication}
                        updateJobApplication={updateJobApplication}
                        deleteJobApplication={deleteJobApplication}
                      />
                      <EmailGenerator generateFollowUpEmail={generateFollowUpEmail} />
                      <InterviewAnalyzer analyzeInterviewAnswer={analyzeInterviewAnswer} />
                    </div>

                    {/* New Analysis Button */}
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={() => {
                          setResults(null)
                          setResumeFile(null)
                          setJobDescription('')
                          setJobUrl('')
                          setError(null)
                        }}
                        className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-semibold"
                      >
                        ← New Analysis
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'history' && (
              <HistoryPage />
            )}

            {activeTab === 'history' && (
              <HistoryPanel
                history={history}
                onOpen={handleOpenHistoryItem}
                onDelete={handleDeleteHistoryItem}
              />
            )}

            {activeTab === 'profile' && (
              <UserProfileForm
                updateUserProfile={updateUserProfile}
                getUserProfile={getUserProfile}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-400 text-sm">
          <p>AI Resume Coach powered by LangGraph + FastAPI + React</p>
        </div>
      </footer>
    </div>
  )
}
