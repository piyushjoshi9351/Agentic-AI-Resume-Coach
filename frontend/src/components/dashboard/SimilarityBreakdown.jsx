import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const item = payload[0]?.payload
  return (
    <div className="rounded-xl border border-dark-border bg-slate-950/95 px-3 py-2 text-sm shadow-xl shadow-black/30">
      <p className="font-semibold text-white">{item?.skill}</p>
      <p className="text-slate-300">{item?.similarityLabel} similarity</p>
    </div>
  )
}

export default function SimilarityBreakdown({ matchingSkills = [] }) {
  const data = useMemo(() => {
    return [...matchingSkills]
      .sort((left, right) => (right.similarity_score || 0) - (left.similarity_score || 0))
      .slice(0, 6)
      .map((skill) => {
        const similarity = Number(skill.similarity_score || 0)
        return {
          skill: skill.skill,
          similarity,
          similarityLabel: similarity.toFixed(2),
          importance: skill.importance || 'medium',
        }
      })
  }, [matchingSkills])

  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card/80 p-6 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-dark-muted">Similarity Breakdown</p>
          <h3 className="mt-2 text-xl font-semibold text-dark-text">Semantic match detail</h3>
        </div>
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          Semantic scores
        </span>
      </div>

      <div className="mt-5 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" domain={[0, 1]} tickFormatter={(value) => value.toFixed(1)} stroke="#64748b" />
            <YAxis type="category" dataKey="skill" width={110} stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="similarity" radius={[0, 12, 12, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.skill}-${index}`}
                  fill={index === 0 ? '#60a5fa' : index === 1 ? '#8b5cf6' : '#14b8a6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {data.map((skill) => (
          <span
            key={skill.skill}
            className="rounded-full border border-dark-border bg-dark-bg/80 px-3 py-1 text-xs font-medium text-slate-200"
          >
            {skill.skill} → {skill.similarityLabel}
          </span>
        ))}
      </div>
    </section>
  )
}