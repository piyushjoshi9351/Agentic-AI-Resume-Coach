import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSavedAnalyses } from '../lib/storage'

const HISTORY_KEY = 'analysis_history_v2'
const AnalysisHistoryContext = createContext(null)

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function createHistoryId(payload) {
  if (payload?.analysis_id != null) return `analysis-${payload.analysis_id}`
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeSavedEntry(entry) {
  if (!entry) return null
  const payload = entry.fullPayload || entry.raw || entry

  const atsScore = Number(payload?.job_match?.ats_match_score || 0)
  const semanticPercent = payload?.job_match?.score_breakdown?.semantic_similarity_percent
  const matchPercentage = typeof semanticPercent === 'number' ? semanticPercent : Number(payload?.job_match?.confidence || 0) * 100
  const confidenceScore = Number(payload?.job_match?.confidence || 0) * 100

  const id = entry.id || createHistoryId(payload)
  const createdAt = entry.createdAt || entry.created_at || new Date().toISOString()
  const resumeName = entry.resumeName || payload?.resume_analysis?.name || payload?.resume_filename || payload?.filename || 'Resume Analysis'
  const resumeFileName = entry.resumeFileName || payload?.resume_filename || payload?.filename || 'resume.pdf'

  const strengths = entry.strengths || payload?.resume_analysis?.strengths || []
  const weaknesses = entry.weaknesses || payload?.resume_analysis?.weaknesses || []
  const areasToImprove = entry.areasToImprove || payload?.resume_analysis?.areas_for_improvement || payload?.job_match?.missing_skills || []

  const recommendationFromPayload = payload?.job_match?.recommendation
  const recommendations = entry.recommendations || (recommendationFromPayload ? [recommendationFromPayload] : [])

  return {
    id,
    analysisId: payload?.analysis_id ?? entry.analysisId ?? null,
    resumeName,
    resumeFileName,
    atsScore,
    matchPercentage,
    confidenceScore,
    skills: entry.skills || payload?.resume_analysis?.skills || {},
    strengths,
    weaknesses,
    areasToImprove,
    recommendations,
    keywords: entry.keywords || payload?.job_match?.keywords || payload?.job_match?.matching_skills || [],
    experienceData: entry.experienceData || payload?.resume_analysis?.experience || payload?.resume_analysis?.experience_analysis || {},
    scoreBreakdowns: entry.scoreBreakdowns || payload?.job_match?.score_breakdown || {},
    fullPayload: payload,
    date: new Date(createdAt).toLocaleDateString(),
    timestamp: createdAt,
    createdAt,
    summary: entry.summary || (recommendations[0] || 'Saved ATS analysis'),
  }
}

function loadInitialHistory() {
  const raw = localStorage.getItem(HISTORY_KEY)
  if (raw) {
    const parsed = safeParse(raw, [])
    if (Array.isArray(parsed)) return parsed.map(normalizeSavedEntry).filter(Boolean)
  }

  // migrate previous storage key if present
  const legacy = getSavedAnalyses() || []
  if (!legacy.length) return []
  return legacy.map(normalizeSavedEntry).filter(Boolean)
}

function persistHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function AnalysisHistoryProvider({ children }) {
  const [analysisHistory, setAnalysisHistory] = useState(() => loadInitialHistory())

  useEffect(() => {
    persistHistory(analysisHistory)
    window.dispatchEvent(new CustomEvent('analysis-history-changed', { detail: { total: analysisHistory.length } }))
  }, [analysisHistory])

  const saveAnalysis = (payload) => {
    if (!payload) return { saved: false, reason: 'empty' }
    const normalized = normalizeSavedEntry(payload)

    setAnalysisHistory((prev) => {
      const duplicate = prev.some((item) => {
        if (normalized.analysisId != null && item.analysisId != null) {
          return String(item.analysisId) === String(normalized.analysisId)
        }
        return item.id === normalized.id
      })

      if (duplicate) return prev
      return [normalized, ...prev]
    })

    const duplicateAfter = analysisHistory.some((item) => {
      if (normalized.analysisId != null && item.analysisId != null) {
        return String(item.analysisId) === String(normalized.analysisId)
      }
      return item.id === normalized.id
    })

    return { saved: !duplicateAfter, reason: duplicateAfter ? 'duplicate' : null, item: normalized }
  }

  const deleteAnalysis = (id) => {
    setAnalysisHistory((prev) => prev.filter((item) => String(item.id) !== String(id)))
  }

  const getAnalysisById = (id) => analysisHistory.find((item) => String(item.id) === String(id)) || null

  const isAnalysisSaved = (payload) => {
    if (!payload) return false
    const analysisId = payload.analysis_id
    if (analysisId == null) return false
    return analysisHistory.some((item) => String(item.analysisId) === String(analysisId))
  }

  const stats = useMemo(() => {
    const total = analysisHistory.length
    const atsValues = analysisHistory.map((item) => Number(item.atsScore)).filter((n) => !Number.isNaN(n))
    const averageAts = total ? atsValues.reduce((a, b) => a + b, 0) / total : 0
    const bestAts = atsValues.length ? Math.max(...atsValues) : 0

    return {
      totalAnalyses: total,
      averageAts,
      bestAts,
    }
  }, [analysisHistory])

  const value = useMemo(
    () => ({
      analysisHistory,
      saveAnalysis,
      deleteAnalysis,
      getAnalysisById,
      isAnalysisSaved,
      stats,
    }),
    [analysisHistory, stats],
  )

  return <AnalysisHistoryContext.Provider value={value}>{children}</AnalysisHistoryContext.Provider>
}

export function useAnalysisHistory() {
  const context = useContext(AnalysisHistoryContext)
  if (!context) {
    throw new Error('useAnalysisHistory must be used within an AnalysisHistoryProvider')
  }
  return context
}
