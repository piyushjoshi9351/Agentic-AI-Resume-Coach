import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BadgePercent, Download, Printer, ShieldCheck, Sparkles } from 'lucide-react'
import ResultsTabs from '../components/ResultsTabs'
import ATSGauge from '../components/dashboard/ATSGauge'
import { downloadReport } from '../services/api'
import { getLatestAnalysis, setLatestAnalysis } from '../lib/storage'
import { useAnalysisHistory } from '../context/AnalysisHistoryContext'

function ResultsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="skeleton-shimmer h-5 w-24 rounded-full bg-white/10" />
        <div className="skeleton-shimmer mt-4 h-10 w-80 max-w-full rounded-2xl bg-white/10" />
        <div className="skeleton-shimmer mt-3 h-4 w-[32rem] max-w-full rounded-full bg-white/10" />
        <div className="mt-8 flex flex-wrap gap-3">
          <div className="skeleton-shimmer h-11 w-32 rounded-2xl bg-white/10" />
          <div className="skeleton-shimmer h-11 w-36 rounded-2xl bg-white/10" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="skeleton-shimmer h-96 rounded-[1.8rem] border border-white/10 bg-white/5 xl:col-span-2" />
        <div className="skeleton-shimmer h-96 rounded-[1.8rem] border border-white/10 bg-white/5" />
      </div>

      <div className="skeleton-shimmer h-[42rem] rounded-[2rem] border border-white/10 bg-white/5" />
      <div className="skeleton-shimmer h-44 rounded-[2rem] border border-white/10 bg-white/5" />
    </div>
  )
}

export default function Results() {
  const location = useLocation()
  const { analysisId } = useParams()
  const [results, setResults] = useState(null)
  const [isHydrating, setIsHydrating] = useState(true)
  const { saveAnalysis, isAnalysisSaved } = useAnalysisHistory()

  useEffect(() => {
    const routeResults = location.state?.results || null
    const storedResults = getLatestAnalysis()
    const normalizedAnalysisId = analysisId != null ? String(analysisId) : null

    let nextResults = null

    if (routeResults && (!normalizedAnalysisId || String(routeResults.analysis_id) === normalizedAnalysisId)) {
      nextResults = routeResults
    } else if (storedResults && (!normalizedAnalysisId || String(storedResults.analysis_id) === normalizedAnalysisId)) {
      nextResults = storedResults
    } else if (!normalizedAnalysisId) {
      nextResults = routeResults || storedResults
    }

    if (nextResults) {
      setResults(nextResults)
      setLatestAnalysis(nextResults)
    } else {
      setResults(null)
    }

    setIsHydrating(false)
  }, [analysisId, location.state])

  const atsScore = useMemo(() => Number(results?.job_match?.ats_match_score || 0), [results])
  const matchPercentage = useMemo(() => {
    const semanticPercent = results?.job_match?.score_breakdown?.semantic_similarity_percent
    if (typeof semanticPercent === 'number') return semanticPercent
    return Number(results?.job_match?.confidence || 0) * 100
  }, [results])
  const confidenceScore = useMemo(() => Number(results?.job_match?.confidence || 0) * 100, [results])

  const handleDownload = async () => {
    if (!results?.analysis_id) return
    const blob = await downloadReport(results.analysis_id)
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `analysis-report-${results.analysis_id}.pdf`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)
  }

  const isSaved = useMemo(() => isAnalysisSaved(results), [isAnalysisSaved, results])

  const handleSave = () => {
    if (!results) return
    const savePayload = {
      id: results.analysis_id != null ? `analysis-${results.analysis_id}` : null,
      resumeName: results?.resume_analysis?.name || results?.resume_filename || 'Resume Analysis',
      resumeFileName: results?.resume_filename || 'resume.pdf',
      atsScore,
      matchPercentage,
      confidenceScore,
      skills: results?.resume_analysis?.skills || {},
      strengths: results?.resume_analysis?.strengths || [],
      weaknesses: results?.resume_analysis?.weaknesses || [],
      areasToImprove: results?.resume_analysis?.areas_for_improvement || results?.job_match?.missing_skills || [],
      recommendations: [results?.job_match?.recommendation].filter(Boolean),
      keywords: results?.job_match?.keywords || results?.job_match?.matching_skills || [],
      experienceData: results?.resume_analysis?.experience || results?.resume_analysis?.experience_analysis || {},
      allScoreBreakdowns: results?.job_match?.score_breakdown || {},
      fullPayload: results,
      date: new Date().toLocaleDateString(),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    saveAnalysis(savePayload)
  }

  if (isHydrating) {
    return <ResultsSkeleton />
  }

  if (!results) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_25px_90px_rgba(0,0,0,0.25)] backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-200">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-white">No analysis loaded yet</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">Run a live analysis to open the premium results workspace.</p>
        <Link to="/analyze" className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white">
          Go to Analyze
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Results</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Analysis Results</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              Review ATS scoring, semantic matching, cover letter output, and interview prep in one dedicated workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition-all hover:-translate-y-0.5 hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!results.analysis_id}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2">Analysis ID: {results.analysis_id || 'Not saved'}</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2">Route: {analysisId ? `/results/${analysisId}` : '/results'}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <motion.section whileHover={{ y: -4 }} className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">ATS Score</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Weighted match gauge</h2>
            </div>
            <Sparkles className="h-5 w-5 text-purple-300" />
          </div>
          <div className="mt-4">
            <ATSGauge score={atsScore} matchLevel={results.job_match?.match_level} breakdown={results.job_match?.score_breakdown || {}} />
          </div>
        </motion.section>

        <motion.section whileHover={{ y: -4 }} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Match Percentage</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Semantic fit</h2>
            </div>
            <BadgePercent className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="mt-10 text-center">
            <div className="text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 to-cyan-300 bg-clip-text">
              {Math.round(matchPercentage)}%
            </div>
            <p className="mt-3 text-sm text-slate-300">Derived from the existing score breakdown and confidence signals.</p>
          </div>
        </motion.section>

        <motion.section whileHover={{ y: -4 }} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Confidence Score</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Model confidence</h2>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="mt-10 text-center">
            <div className="text-6xl font-black text-transparent bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text">
              {Math.round(confidenceScore)}%
            </div>
            <p className="mt-3 text-sm text-slate-300">Pulled from the backend job-match confidence field.</p>
          </div>
        </motion.section>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Main Content</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Deep analysis tabs</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Resume analysis, ATS match, cover letter, and interview prep are organized below using the existing backend payload.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <ResultsTabs results={results} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/analyze" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" />
          Back to Analyze
        </Link>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaved}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaved ? 'Already Saved' : 'Save to History'}
        </button>
      </div>
    </motion.div>
  )
}