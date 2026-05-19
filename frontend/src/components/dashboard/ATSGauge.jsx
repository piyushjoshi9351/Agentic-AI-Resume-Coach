import React, { useMemo } from 'react'

const SCORE_COLORS = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
}

function pickColor(score) {
  if (score >= 80) return SCORE_COLORS.high
  if (score >= 55) return SCORE_COLORS.medium
  return SCORE_COLORS.low
}

export default function ATSGauge({ score = 0, matchLevel = '', breakdown = {} }) {
  const normalizedScore = useMemo(() => Math.max(0, Math.min(100, Number(score) || 0)), [score])
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (normalizedScore / 100) * circumference
  const accent = pickColor(normalizedScore)

  const components = [
    { label: 'Skills', value: breakdown.skill_score },
    { label: 'Exp.', value: breakdown.experience_score },
    { label: 'Projects', value: breakdown.project_score },
    { label: 'Edu.', value: breakdown.education_score },
  ]

  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card/80 p-6 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-dark-muted">ATS Gauge</p>
          <h3 className="mt-2 text-xl font-semibold text-dark-text">Weighted ATS Score</h3>
        </div>
        <span className="rounded-full border border-dark-border bg-dark-bg/80 px-3 py-1 text-xs font-semibold text-dark-muted">
          {matchLevel || 'In review'}
        </span>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="relative h-72 w-72">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 120 120" role="img" aria-label="ATS score gauge">
            <defs>
              <linearGradient id="atsGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="55%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor={accent} />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#1f2937" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="url(#atsGaugeGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-6xl font-black text-transparent bg-gradient-to-r from-purple-glow to-blue-glow bg-clip-text">
              {Math.round(normalizedScore)}%
            </div>
            <p className="mt-2 text-sm text-dark-muted">Weighted final score</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-left">
              {components.map((component) => (
                <div key={component.label} className="rounded-lg border border-dark-border bg-dark-bg/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-dark-muted">{component.label}</p>
                  <p className="text-sm font-semibold text-dark-text">
                    {typeof component.value === 'number' ? component.value.toFixed(1) : '0.0'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}