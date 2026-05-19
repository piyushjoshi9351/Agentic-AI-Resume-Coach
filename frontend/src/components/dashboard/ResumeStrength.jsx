import React from 'react'

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-bg/70 p-3">
      <p className="text-[11px] uppercase tracking-wide text-dark-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-dark-text">{value}</p>
    </div>
  )
}

export default function ResumeStrength({ resumeAnalysis = {}, scoreBreakdown = {}, impactLine = '', matchLevel = '' }) {
  const overallConfidence = Number(resumeAnalysis?.overall_assessment?.confidence || resumeAnalysis?.confidence || 0)
  const summary = resumeAnalysis?.overall_assessment?.summary || 'Resume signals are structured, measurable, and easy to map to the target role.'

  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card/80 p-6 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-dark-muted">Resume Strength</p>
          <h3 className="mt-2 text-xl font-semibold text-dark-text">What makes this resume strong</h3>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          {matchLevel || 'Semantic fit'}
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-purple-glow/40 bg-gradient-to-br from-purple-glow/15 via-dark-bg/75 to-blue-glow/15 p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dark-muted">Power line</p>
        <p className="mt-3 text-2xl font-bold leading-tight text-white">
          {impactLine || 'Built interactive analytics dashboard for ATS insights and skill-gap visualization.'}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric label="Semantic match" value={`${Number(scoreBreakdown?.semantic_similarity_percent || 0).toFixed(1)}%`} />
        <Metric label="Weighted score" value={`${Number(scoreBreakdown?.final_score || 0).toFixed(1)}%`} />
        <Metric label="Confidence" value={`${Math.round(overallConfidence * 100)}%`} />
        <Metric label="Quality" value={resumeAnalysis?.overall_assessment?.quality_score || 'Good'} />
      </div>

      <div className="mt-5 rounded-xl border border-dark-border bg-dark-bg/70 p-4">
        <p className="text-sm font-medium text-dark-text">Summary</p>
        <p className="mt-2 text-sm leading-relaxed text-dark-muted">{summary}</p>
      </div>
    </section>
  )
}