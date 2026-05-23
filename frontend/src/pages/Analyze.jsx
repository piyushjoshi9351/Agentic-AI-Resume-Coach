import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ResumeUpload from '../components/ResumeUpload'
import JobDescription from '../components/JobDescription'
import AnalyzeButton from '../components/AnalyzeButton'
import ProgressSteps from '../components/ProgressSteps'
import JobSearch from '../components/JobSearch'
import JobParserPanel from '../components/JobParserPanel'
import { analyzeResume, parseJobUrl, searchJobs } from '../services/api'
import { setLatestAnalysis } from '../lib/storage'

export default function Analyze() {
  const navigate = useNavigate()
  const location = useLocation()
  const [resumeFile, setResumeFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resumeError, setResumeError] = useState('')
  const [jobError, setJobError] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)

  useEffect(() => {
    const prefill = location.state?.prefill
    if (!prefill) return
    if (prefill.jobDescription) setJobDescription(prefill.jobDescription)
    if (prefill.jobUrl) setJobUrl(prefill.jobUrl)
  }, [location.state])

  const isFormValid = useMemo(
    () => Boolean(resumeFile && (jobDescription.trim().length >= 50 || jobUrl.trim().length > 0)),
    [resumeFile, jobDescription, jobUrl],
  )

  const handleAnalyze = async ({ jobDescription: overrideJobDescription, jobUrl: overrideJobUrl } = {}) => {
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
    const response = await analyzeResume(resumeFile, effectiveJobDescription, effectiveJobUrl)

    if (response.success) {
      setLatestAnalysis(response.data)
      navigate('/results', { state: { results: response.data } })
    } else {
      setError(response.error)
    }

    setIsLoading(false)
  }

  const handleLiveJobSelected = async (job) => {
    const selectedDescription = job?.description || ''
    const selectedUrl = job?.job_url || ''

    setSelectedJob(job)
    setJobDescription(selectedDescription)
    setJobUrl(selectedUrl)
    setJobError('')

    if (resumeFile && selectedDescription.trim().length >= 50) {
      await handleAnalyze({ jobDescription: selectedDescription, jobUrl: selectedUrl })
    }
  }

  const handleJobParsed = ({ jobUrl: parsedUrl, parsedJobData }) => {
    setJobUrl(parsedUrl)
    setJobDescription(parsedJobData?.raw_text || parsedJobData?.description || jobDescription)
    setJobError('')
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Analyze</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Run the live ATS pipeline</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              Upload a resume, choose a job, and send the request to the existing FastAPI backend.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
            {selectedJob ? `Selected: ${selectedJob.title || 'Live job'}` : 'No live job selected'}
          </div>
        </div>
      </section>

      <JobSearch searchJobs={searchJobs} onSelectJob={handleLiveJobSelected} />
      <JobParserPanel onParsed={handleJobParsed} parseJobUrl={parseJobUrl} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ResumeUpload resumeFile={resumeFile} setResumeFile={setResumeFile} error={resumeError} onValidationError={setResumeError} />
        <JobDescription jobDescription={jobDescription} setJobDescription={setJobDescription} error={jobError} />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <AnalyzeButton isLoading={isLoading} isValid={isFormValid} onClick={() => handleAnalyze()} />
      <ProgressSteps isLoading={isLoading} />
    </div>
  )
}