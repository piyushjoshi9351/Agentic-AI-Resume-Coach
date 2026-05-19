import React from 'react'

function Meter({ label, value }) {
  const normalized = Math.max(0, Math.min(10, Number(value) || 0))
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-dark-muted">
        <span>{label}</span>
        <span>{normalized.toFixed(1)}/10</span>
      </div>
      <div className="h-2 rounded-full bg-dark-bg overflow-hidden border border-dark-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-glow to-blue-glow transition-all duration-500"
          style={{ width: `${normalized * 10}%` }}
        />
      </div>
    </div>
  )
}

export default function InterviewFeedback({ feedback }) {
  if (!feedback) return null

  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-dark-muted">AI Evaluation</p>
          <h3 className="mt-2 text-xl font-semibold text-dark-text">Answer feedback</h3>
        </div>
        <div className="rounded-full border border-purple-glow/30 bg-purple-glow/10 px-4 py-2 text-sm font-semibold text-purple-200">
          {Number(feedback.score_out_of_10 || 0).toFixed(1)}/10
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Meter label="Technical depth" value={feedback.technical_depth} />
        <Meter label="Clarity" value={feedback.clarity} />
        <Meter label="Confidence" value={feedback.confidence} />
        <Meter label="Communication" value={feedback.communication} />
        <Meter label="Relevance" value={feedback.relevance} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h4 className="font-semibold text-emerald-200">Strengths</h4>
          <ul className="mt-2 space-y-2 text-sm text-slate-200">
            {feedback.strengths?.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h4 className="font-semibold text-amber-200">Improvements</h4>
          <ul className="mt-2 space-y-2 text-sm text-slate-200">
            {feedback.improvements?.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}