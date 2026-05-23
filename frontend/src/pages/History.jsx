import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clock3, Trash2 } from 'lucide-react'
import { setLatestAnalysis } from '../lib/storage'
import { useAnalysisHistory } from '../context/AnalysisHistoryContext'

function formatTimestamp(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function History() {
  const navigate = useNavigate()
  const { analysisHistory, deleteAnalysis } = useAnalysisHistory()

  const handleViewResult = (item) => {
    const payload = item.fullPayload || null
    if (!payload) return
    setLatestAnalysis(payload)
    const path = item.analysisId != null ? `/results/${item.analysisId}` : '/results'
    navigate(path, { state: { results: payload } })
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_25px_90px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">History</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Saved Resume Analyses</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Access, review, and manage all saved ATS analyses from one place.</p>
          </div>
          <Link to="/analyze" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5 hover:shadow-purple-500/35">
            Analyze New Resume
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {analysisHistory.length ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {analysisHistory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.03 }}
              className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-white">{item.resumeFileName || item.resumeName}</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatTimestamp(item.createdAt)}
                  </p>
                </div>
                <div className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
                  ATS {Math.round(Number(item.atsScore || 0))}%
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Match</p>
                  <p className="mt-1 text-base font-semibold text-white">{Math.round(Number(item.matchPercentage || 0))}%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Confidence</p>
                  <p className="mt-1 text-base font-semibold text-white">{Math.round(Number(item.confidenceScore || 0))}%</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300">{item.summary || 'Saved ATS analysis for this resume.'}</p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleViewResult(item)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-all hover:-translate-y-0.5 hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white"
                >
                  View Result
                </button>
                <button
                  type="button"
                  onClick={() => deleteAnalysis(item.id)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition-all hover:-translate-y-0.5 hover:border-red-400/60"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </section>
      ) : (
        <section className="rounded-[1.8rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <p className="text-lg font-semibold text-white">No saved analyses yet</p>
          <p className="mt-2 text-sm text-slate-300">Run a resume analysis, then use Save to History on the results page.</p>
          <Link to="/analyze" className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-all hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white">
            Go to Analyze
          </Link>
        </section>
      )}
    </div>
  )
}
