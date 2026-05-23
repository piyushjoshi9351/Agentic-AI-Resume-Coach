import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ArrowRight, BarChart3, BrainCircuit, ChartSpline, Clock3, FileText, PlayCircle, Sparkles, TrendingUp, WandSparkles } from 'lucide-react'
import SkillMatchChart from '../components/dashboard/SkillMatchChart'
import { getAnalyticsSummary, getCurrentUser, getHistory, getInterviewHistory } from '../services/api'
import { setLatestAnalysis } from '../lib/storage'

function formatTimestamp(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function getLatestAnalysis(history = []) {
  return history?.[0] || null
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-[1.8rem] border border-white/10 bg-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr_0.9fr]">
        <div className="h-[28rem] rounded-[1.8rem] border border-white/10 bg-white/5" />
        <div className="h-[28rem] rounded-[1.8rem] border border-white/10 bg-white/5" />
        <div className="h-[28rem] rounded-[1.8rem] border border-white/10 bg-white/5" />
      </div>
      <div className="h-40 rounded-[1.8rem] border border-white/10 bg-white/5" />
    </div>
  )
}

function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let animationFrame
    const startTime = performance.now()
    const duration = 1000
    const startValue = 0
    const targetValue = Number(value || 0)

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = startValue + (targetValue - startValue) * eased
      setDisplayValue(nextValue)
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate)
      }
    }

    animationFrame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [value])

  return (
    <span>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [interviewHistory, setInterviewHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      try {
        const [userResult, historyResult, analyticsResult, interviewResult] = await Promise.all([
          getCurrentUser(),
          getHistory(),
          getAnalyticsSummary(),
          getInterviewHistory(),
        ])

        setUser(userResult)
        setHistory(Array.isArray(historyResult) ? historyResult : [])
        setAnalytics(analyticsResult)
        setInterviewHistory(Array.isArray(interviewResult) ? interviewResult : [])
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const latestAnalysis = useMemo(() => getLatestAnalysis(history), [history])
  const recentAnalyses = useMemo(() => history.slice(0, 5), [history])

  const skillChartData = useMemo(() => {
    if (!latestAnalysis?.resume_analysis || !latestAnalysis?.job_match) return null
    return {
      resumeSkills: latestAnalysis.resume_analysis?.skills?.technical || [],
      matchingSkills: latestAnalysis.job_match?.matching_skills || [],
    }
  }, [latestAnalysis])

  const statCards = [
    {
      label: 'Total Analyses',
      value: analytics?.total_analyses ?? history.length,
      icon: BarChart3,
      accent: 'from-purple-500/25 to-fuchsia-500/25',
    },
    {
      label: 'Average ATS Score',
      value: analytics?.avg_ats_score ?? 0,
      suffix: '%',
      decimals: 1,
      icon: TrendingUp,
      accent: 'from-blue-500/25 to-cyan-500/25',
    },
    {
      label: 'Best ATS Score',
      value: analytics?.best_ats_score ?? 0,
      suffix: '%',
      decimals: 1,
      icon: Sparkles,
      accent: 'from-purple-500/25 to-blue-500/25',
    },
    {
      label: 'Interview Sessions',
      value: analytics?.recent_interview_sessions?.length ?? interviewHistory.length,
      icon: PlayCircle,
      accent: 'from-emerald-500/20 to-teal-500/20',
    },
  ]

  const aiTips = useMemo(() => {
    const tips = []
    const missing = analytics?.top_missing_skills || []

    if (missing.length) {
      tips.push(`Focus on ${missing.slice(0, 3).join(', ')} in your next resume revision.`)
    }

    if (latestAnalysis?.job_match?.recommendation) {
      tips.push(latestAnalysis.job_match.recommendation)
    }

    if (!tips.length) {
      tips.push('Run a fresh analysis to generate ATS-driven recommendations.')
    }

    return tips.slice(0, 3)
  }, [analytics, latestAnalysis])

  const activityFeed = useMemo(() => {
    const items = []

    recentAnalyses.slice(0, 3).forEach((item) => {
      items.push({
        id: `analysis-${item.id}`,
        type: 'Analysis saved',
        title: item.resume_filename,
        meta: `${formatTimestamp(item.created_at)} • ATS ${item.job_match?.ats_match_score ?? 'N/A'}%`,
      })
    })

    interviewHistory.slice(0, 3).forEach((session) => {
      items.push({
        id: `interview-${session.id}`,
        type: 'Interview session',
        title: `Session #${session.id}`,
        meta: `${formatTimestamp(session.created_at)} • ${session.status || 'active'}`,
      })
    })

    return items.slice(0, 5)
  }, [recentAnalyses, interviewHistory])

  const handleOpenAnalysis = (item) => {
    setLatestAnalysis({ ...item, analysis_id: item.id })
    navigate('/results')
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_25px_90px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Overview for {user?.name || 'your workspace'}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              A focused executive view of your AI resume pipeline, recent analyses, interview progress, and quick actions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/analyze" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5 hover:shadow-purple-500/35">
              Analyze Resume
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/interview" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white">
              Start Mock Interview
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <AnimatePresence>
              {statCards.map((card, index) => {
                const Icon = card.icon
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: index * 0.06 }}
                    whileHover={{ y: -6, scale: 1.01 }}
                    className={`relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.25)] transition-all`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60`} />
                    <div className="absolute inset-0 bg-slate-950/60" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] text-slate-400">{card.label}</p>
                        <p className="mt-3 text-3xl font-black text-white">
                          <AnimatedCounter value={card.value} suffix={card.suffix || ''} decimals={card.decimals || 0} />
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-[0_0_24px_rgba(168,85,247,0.22)]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr_0.9fr]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.04 }}
              className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent Analyses</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Last 5 saved analyses</h2>
                </div>
                <FileText className="h-5 w-5 text-purple-300" />
              </div>

              <div className="space-y-3">
                {recentAnalyses.length ? (
                  recentAnalyses.map((item, index) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.04 }}
                      onClick={() => handleOpenAnalysis(item)}
                      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 text-left transition-all hover:border-purple-500/30 hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{item.resume_filename}</p>
                        <p className="mt-1 truncate text-xs text-slate-400">{formatTimestamp(item.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
                          ATS {item.job_match?.ats_match_score ?? 'N/A'}%
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-purple-300" />
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-sm text-slate-400">
                    No saved analyses yet. Start with a new resume analysis.
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Skill Gap Trends</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Capability radar</h2>
                </div>
                <ChartSpline className="h-5 w-5 text-purple-300" />
              </div>

              {skillChartData ? (
                <SkillMatchChart resumeSkills={skillChartData.resumeSkills} matchingSkills={skillChartData.matchingSkills} />
              ) : (
                <div className="flex h-full min-h-[28rem] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-center text-sm text-slate-400">
                  Run an analysis to visualize skill gap trends.
                </div>
              )}
            </motion.div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
                className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI Tips</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Recommendations</h2>
                  </div>
                  <BrainCircuit className="h-5 w-5 text-purple-300" />
                </div>

                <div className="space-y-3">
                  {aiTips.map((tip, index) => (
                    <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-7 text-slate-200">
                      {tip}
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.16 }}
                className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent Activity</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Live feed</h2>
                  </div>
                  <Activity className="h-5 w-5 text-purple-300" />
                </div>

                <div className="space-y-3">
                  {activityFeed.length ? (
                    activityFeed.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.type}</p>
                        <p className="mt-2 text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.meta}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-5 text-sm text-slate-400">
                      No recent activity yet.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Quick Actions</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Jump straight to the next step</h2>
              </div>
              <WandSparkles className="h-5 w-5 text-purple-300" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { label: 'Analyze Resume', to: '/analyze', icon: FileText, description: 'Run a new ATS analysis using the live backend.' },
                { label: 'Start Mock Interview', to: '/interview', icon: PlayCircle, description: 'Practice with your latest saved analysis.' },
                { label: 'Track Jobs', to: '/job-tracker', icon: Clock3, description: 'Manage applications and follow-ups in one place.' },
              ].map((action, index) => {
                const Icon = action.icon
                return (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ y: -6 }}
                    className="group rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition-all hover:border-purple-500/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/25 to-blue-500/25 ring-1 ring-white/10">
                          <Icon className="h-5 w-5 text-purple-200" />
                        </div>
                        <h3 className="mt-5 text-lg font-semibold text-white">{action.label}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-400">{action.description}</p>
                      </div>
                    </div>

                    <Link
                      to={action.to}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white"
                    >
                      Open
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.section>
        </>
      )}
    </div>
  )
}