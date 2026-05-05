import React from 'react'
import { BarChart3, TrendingUp, Award, CalendarClock } from 'lucide-react'

export default function AnalyticsPanel({ analytics }) {
  if (!analytics) {
    return null
  }

  const cards = [
    {
      label: 'Total Analyses',
      value: analytics.total_analyses ?? 0,
      icon: BarChart3,
    },
    {
      label: 'Average ATS',
      value: `${analytics.avg_ats_score ?? 0}%`,
      icon: TrendingUp,
    },
    {
      label: 'Best ATS Score',
      value: `${analytics.best_ats_score ?? 0}%`,
      icon: Award,
    },
    {
      label: 'Last 7 Days',
      value: analytics.analyses_last_7_days ?? 0,
      icon: CalendarClock,
    },
  ]

  return (
    <section className="mb-8 animate-fadeInUp">
      <div className="border border-dark-border rounded-2xl bg-dark-card/60 p-5">
        <h3 className="text-lg font-semibold text-dark-text mb-4">Analytics Dashboard</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-xl border border-dark-border bg-dark-bg/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-dark-muted uppercase tracking-wide">{card.label}</p>
                  <Icon className="w-4 h-4 text-purple-glow" />
                </div>
                <p className="text-2xl font-bold text-dark-text">{card.value}</p>
              </div>
            )
          })}
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-bg/70 p-4">
          <p className="text-sm font-medium text-dark-text mb-2">Top Missing Skills</p>
          {analytics.top_missing_skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {analytics.top_missing_skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full text-xs border border-purple-glow/50 bg-purple-glow/10 text-purple-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-muted">No missing skill trend available yet.</p>
          )}
        </div>
      </div>
    </section>
  )
}
