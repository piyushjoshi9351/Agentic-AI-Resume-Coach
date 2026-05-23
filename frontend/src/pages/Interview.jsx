import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import InterviewSession from '../components/interview/InterviewSession'
import { startInterviewSession, evaluateInterviewAnswer } from '../services/api'
import { getLatestAnalysisId } from '../lib/storage'

export default function Interview() {
  const analysisId = getLatestAnalysisId()

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.25)] backdrop-blur-xl"
      >
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Interview</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">AI Mock Interview</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
          Practice interviews with AI and receive intelligent feedback.
        </p>
      </motion.section>

      {!analysisId ? (
        <div className="rounded-[2rem] border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100 shadow-[0_25px_90px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <p className="font-semibold">No saved analysis found.</p>
          <p className="mt-2 text-sm">Run an analysis first, then come back here to start the interview session.</p>
          <Link to="/analyze" className="mt-4 inline-flex rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white">
            Go to Analyze
          </Link>
        </div>
      ) : (
        <InterviewSession
          analysisId={Number(analysisId)}
          startInterviewSession={startInterviewSession}
          evaluateInterviewAnswer={evaluateInterviewAnswer}
        />
      )}
    </div>
  )
}