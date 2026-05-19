import React, { useMemo } from 'react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const CATEGORIES = [
  {
    label: 'Frontend',
    keywords: ['react', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'redux', 'ui'],
  },
  {
    label: 'Backend',
    keywords: ['fastapi', 'flask', 'django', 'api', 'rest api', 'sql', 'postgresql', 'mysql'],
  },
  {
    label: 'AI',
    keywords: ['machine learning', 'nlp', 'llm', 'langchain', 'langgraph', 'embeddings', 'pandas', 'numpy'],
  },
  {
    label: 'Cloud',
    keywords: ['aws', 'docker', 'kubernetes', 'azure', 'gcp', 'devops', 'ci/cd'],
  },
  {
    label: 'DSA',
    keywords: ['algorithms', 'data structures', 'problem solving', 'leetcode', 'optimization', 'binary tree'],
  },
]

function scoreCategory(category, resumeSkills, matchingSkills) {
  const resumePool = [...resumeSkills, ...matchingSkills.map((item) => item.skill || '')]
    .map((value) => value.toLowerCase())
    .filter(Boolean)

  if (!category.keywords.length) return 0

  const hits = category.keywords.filter((keyword) =>
    resumePool.some((entry) => entry.includes(keyword) || keyword.includes(entry))
  ).length

  return Math.round(Math.min(100, (hits / category.keywords.length) * 100))
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-dark-border bg-slate-950/95 px-3 py-2 text-sm shadow-xl shadow-black/30">
      <p className="font-semibold text-white">{label}</p>
      <p className="text-slate-300">Match score: {payload[0].value}%</p>
    </div>
  )
}

export default function SkillMatchChart({ resumeSkills = [], matchingSkills = [] }) {
  const data = useMemo(
    () => CATEGORIES.map((category) => ({
      category: category.label,
      score: scoreCategory(category, resumeSkills, matchingSkills),
    })),
    [resumeSkills, matchingSkills]
  )

  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card/80 p-6 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-dark-muted">Skill Match Radar</p>
          <h3 className="mt-2 text-xl font-semibold text-dark-text">Capability map</h3>
        </div>
        <div className="rounded-full border border-dark-border bg-dark-bg/80 px-3 py-1 text-xs font-semibold text-dark-muted">
          Frontend · Backend · AI · Cloud · DSA
        </div>
      </div>

      <div className="mt-6 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="category" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              dataKey="score"
              stroke="#8b5cf6"
              fill="url(#skillMatchFill)"
              fillOpacity={0.35}
              strokeWidth={3}
            />
            <defs>
              <linearGradient id="skillMatchFill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}