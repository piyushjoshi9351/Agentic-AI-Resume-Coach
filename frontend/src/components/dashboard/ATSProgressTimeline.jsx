import React, { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

function formatDateLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function TimelineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-dark-border bg-slate-950/95 px-3 py-2 text-sm shadow-xl shadow-black/30">
      <p className="font-semibold text-white">{label}</p>
      <p className="text-slate-300">ATS Score: {payload[0].value}%</p>
      <p className="text-slate-300">Semantic: {payload[1]?.value}%</p>
    </div>
  )
}

export default function ATSProgressTimeline({ points = [] }) {
  const data = useMemo(
    () =>
      points.map((point) => ({
        label: formatDateLabel(point.created_at),
        atsScore: Number(point.ats_score || 0),
        semantic: Number(point.semantic_match_percent || 0),
      })),
    [points]
  )

  if (!data.length) {
    return (
      <div className="rounded-xl border border-dark-border bg-dark-bg/70 p-4">
        <p className="text-sm text-dark-muted">No ATS progress history yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-dark-border bg-dark-bg/70 p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-dark-text">ATS Score Progress</p>
        <span className="text-xs text-dark-muted">Timeline across saved analyses</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
            <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
            <Tooltip content={<TimelineTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="atsScore" name="ATS Score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="semantic" name="Semantic %" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}