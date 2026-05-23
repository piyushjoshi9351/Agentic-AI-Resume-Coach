import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BrainCircuit, ChevronDown, ChevronUp, Mail, Sparkles } from 'lucide-react'
import ResumeImprover from '../components/ResumeImprover'
import EmailGenerator from '../components/EmailGenerator'
import InterviewAnalyzer from '../components/InterviewAnalyzer'
import { analyzeInterviewAnswer, improveResume, getResumeDiff, generateFollowUpEmail } from '../services/api'
import { getLatestAnalysisId } from '../lib/storage'

export default function Tools() {
  const [activeTool, setActiveTool] = useState('email')
  const [isMounted, setIsMounted] = useState(false)
  const analysisId = useMemo(() => getLatestAnalysisId(), [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsMounted(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const tools = [
    {
      id: 'email',
      title: 'Follow-Up Email Generator',
      description: 'Write polished follow-up emails for recent applications using the existing AI email API.',
      icon: Mail,
      accent: 'from-purple-500/25 to-blue-500/20',
    },
    {
      id: 'interview',
      title: 'Interview Answer Analyzer',
      description: 'Paste a question and answer to get structured AI feedback from the live interview endpoint.',
      icon: BrainCircuit,
      accent: 'from-blue-500/25 to-cyan-500/20',
    },
    {
      id: 'resume',
      title: 'AI Resume Improver',
      description: 'Generate an improved resume and diff from your latest saved analysis result.',
      icon: Sparkles,
      accent: 'from-emerald-500/20 to-teal-500/20',
    },
  ]

  const renderTool = (toolId) => {
    if (toolId === 'email') return <EmailGenerator generateFollowUpEmail={generateFollowUpEmail} />
    if (toolId === 'interview') return <InterviewAnalyzer analyzeInterviewAnswer={analyzeInterviewAnswer} />
    if (toolId === 'resume') {
      if (!analysisId) {
        return (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-slate-300">
            Run an analysis first to unlock the resume improver.
          </div>
        )
      }

      return <ResumeImprover analysisId={Number(analysisId)} improveResume={improveResume} getResumeDiff={getResumeDiff} />
    }

    return null
  }

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.45 }}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.25)] backdrop-blur-xl"
      >
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Tools</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">AI Career Tools</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
          Smart AI tools to improve applications and interview performance.
        </p>
      </motion.section>

      {!isMounted ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-shimmer h-[28rem] rounded-[2rem] border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {tools.map((tool, index) => {
            const Icon = tool.icon
            const expanded = activeTool === tool.id

            return (
              <motion.section
                key={tool.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className={`overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all ${expanded ? 'ring-1 ring-purple-400/30' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTool(expanded ? '' : tool.id)}
                  className="flex w-full items-start justify-between gap-4 p-6 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${tool.accent} text-white shadow-lg shadow-black/20`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Card {index + 1}</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">{tool.title}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">{tool.description}</p>
                    </div>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-slate-200 transition-colors hover:border-purple-400/30 hover:text-white">
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28 }}
                      className="border-t border-white/10 px-6 pb-6"
                    >
                      <div className="pt-6">{renderTool(tool.id)}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            )
          })}
        </div>
      )}
    </div>
  )
}