import React from 'react'
import { Link } from 'react-router-dom'
import InterviewSession from '../components/interview/InterviewSession'
import InterviewAnalyzer from '../components/InterviewAnalyzer'
import { startInterviewSession, evaluateInterviewAnswer, analyzeInterviewAnswer } from '../services/api'
import { getLatestAnalysisId } from '../lib/storage'

export default function Interview() {
  const analysisId = getLatestAnalysisId()

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Interview</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Practice with the live backend interview flow</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
          The mock interview uses your latest saved analysis so questions stay tied to the real ATS result.
        </p>
      </section>

      {!analysisId ? (
        <div className="rounded-[2rem] border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
          <p className="font-semibold">No saved analysis found.</p>
          <p className="mt-2 text-sm">Run an analysis first, then come back here to start the interview session.</p>
          <Link to="/analyze" className="mt-4 inline-flex rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white">
            Go to Analyze
          </Link>
        </div>
      ) : (
        <>
          <InterviewSession
            analysisId={Number(analysisId)}
            startInterviewSession={startInterviewSession}
            evaluateInterviewAnswer={evaluateInterviewAnswer}
          />
          <InterviewAnalyzer analyzeInterviewAnswer={analyzeInterviewAnswer} />
        </>
      )}
    </div>
  )
}