import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, ArrowRight, RotateCcw, CheckCircle2, Clock3, Sparkles, BrainCircuit, Activity, Mic } from 'lucide-react'
import VoiceRecorder from './VoiceRecorder'
import InterviewFeedback from './InterviewFeedback'
import { getInterviewSessionState } from '../../services/api'

const formatDuration = (seconds = 0) => {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }

  return `${remainingSeconds}s`
}

function MetricCard({ label, value, helper, icon: Icon }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <h3 className="mt-3 text-3xl font-black text-white">{value}</h3>
          {helper && <p className="mt-2 text-sm text-slate-300">{helper}</p>}
        </div>
        {Icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-purple-200">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

function SummaryList({ title, items, tone = 'slate' }) {
  const toneClasses = {
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-100',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-100',
    purple: 'border-purple-500/20 bg-purple-500/5 text-purple-100',
    slate: 'border-white/10 bg-white/5 text-slate-100',
  }

  return (
    <div className={`rounded-[1.8rem] border p-5 ${toneClasses[tone] || toneClasses.slate} backdrop-blur-xl`}>
      <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">{title}</h4>
      {items?.length ? (
        <ul className="mt-4 space-y-3 text-sm leading-7">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3 text-slate-100">
              <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-current opacity-80" />
              <span>{typeof item === 'string' ? item : item?.weakness || item?.strength || item?.recommendation || item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Complete a question to populate this section.</p>
      )}
    </div>
  )
}

export default function InterviewSession({ analysisId, startInterviewSession, evaluateInterviewAnswer }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [readyToAdvance, setReadyToAdvance] = useState(false)
  const [nextQuestion, setNextQuestion] = useState(null)
  const [sessionStartedAt, setSessionStartedAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [hydrating, setHydrating] = useState(true)
  const [isListening, setIsListening] = useState(false)

  const questions = session?.questions || []
  const responses = session?.responses || []
  const currentIndex = session?.current_index ?? 0
  const currentQuestion = questions[currentIndex]
  const completed = Boolean(session && currentIndex >= questions.length)
  const completedQuestions = responses.length
  const latestFeedback = feedback || responses[responses.length - 1]?.feedback || null
  const elapsedSeconds = sessionStartedAt ? Math.max(0, Math.floor((now - sessionStartedAt) / 1000)) : 0
  const progressRatio = questions.length ? Math.min(completedQuestions / questions.length, 1) : 0

  const progressLabel = useMemo(() => {
    if (!session) return '0 / 0'
    return `${Math.min(currentIndex + 1, questions.length)} / ${questions.length}`
  }, [currentIndex, questions.length, session])

  const pace = useMemo(() => {
    const words = answer.trim() ? answer.trim().split(/\s+/).length : 0
    const minutes = Math.max(elapsedSeconds / 60, 1)
    return Math.round(words / minutes)
  }, [answer, elapsedSeconds])

  useEffect(() => {
    if (!sessionStartedAt) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [sessionStartedAt])

  useEffect(() => {
    let isMounted = true

    const hydrateSession = async () => {
      if (!analysisId) {
        setHydrating(false)
        return
      }

      setHydrating(true)
      setSession(null)
      setAnswer('')
      setFeedback(null)
      setReadyToAdvance(false)
      setNextQuestion(null)

      const savedSessionId = localStorage.getItem(`interview-session:${analysisId}`)
      const savedMetaRaw = localStorage.getItem(`interview-session-meta:${analysisId}`)
      let savedMeta = null
      if (savedMetaRaw) {
        try {
          savedMeta = JSON.parse(savedMetaRaw)
        } catch {
          savedMeta = null
        }
      }

      if (savedSessionId) {
        const result = await getInterviewSessionState(savedSessionId)
        if (isMounted && result.success) {
          setSession(result.data)
          setSessionStartedAt(Number(savedMeta?.startedAt) || Date.now())
        }
      } else if (isMounted) {
        setSessionStartedAt(null)
      }

      if (isMounted) {
        setHydrating(false)
      }
    }

    hydrateSession()

    return () => {
      isMounted = false
    }
  }, [analysisId])

  const startSession = async () => {
    if (!analysisId) {
      setError('Save an analysis first to start the voice interview.')
      return
    }

    setLoading(true)
    setError('')
    setFeedback(null)
    setNextQuestion(null)

    const result = await startInterviewSession(analysisId)
    if (result.success) {
      setSession(result.data)
      localStorage.setItem(`interview-session:${analysisId}`, result.data.session_id)
      const startedAt = Date.now()
      setSessionStartedAt(startedAt)
      localStorage.setItem(`interview-session-meta:${analysisId}`, JSON.stringify({ startedAt }))
      setAnswer('')
      setReadyToAdvance(false)
      setNextQuestion(null)
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  const submitAnswer = async () => {
    if (!session || !currentQuestion || !answer.trim()) return

    setLoading(true)
    const result = await evaluateInterviewAnswer({
      sessionId: session.session_id,
      questionIndex: currentIndex,
      question: currentQuestion.question,
      answer,
    })

    if (result.success) {
      setFeedback(result.data)
      setSession((prev) => ({
        ...prev,
        responses: [...(prev.responses || []), { question: currentQuestion.question, answer, feedback: result.data }],
      }))
      setNextQuestion(result.data.next_question || null)
      setReadyToAdvance(!result.data.completed)
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  const advanceToNext = () => {
    if (!session || completed) return
    setAnswer('')
    setFeedback(null)
    setReadyToAdvance(false)
    setNextQuestion(null)
    setSession((prev) => ({
      ...prev,
      current_index: Math.min((prev.current_index || 0) + 1, questions.length),
    }))
  }

  const restartSession = () => {
    setSession(null)
    setAnswer('')
    setFeedback(null)
    setReadyToAdvance(false)
    setNextQuestion(null)
    setError('')
    setSessionStartedAt(null)
    setHydrating(false)
    if (analysisId) {
      localStorage.removeItem(`interview-session:${analysisId}`)
      localStorage.removeItem(`interview-session-meta:${analysisId}`)
    }
  }

  const confidenceMetric = latestFeedback ? Math.round((Number(latestFeedback.confidence || 0) / 10) * 100) : 0
  const communicationMetric = latestFeedback ? Math.round((Number(latestFeedback.communication || 0) / 10) * 100) : 0
  const qualityMetric = latestFeedback ? Math.round((Number(latestFeedback.score_out_of_10 || 0) / 10) * 100) : 0

  const summaryStrengths = latestFeedback?.strengths || []
  const summaryWeaknesses = latestFeedback?.improvements || []
  const summarySuggestions = latestFeedback?.improvements || []

  const interviewSummaryFeedback = latestFeedback

  if (hydrating) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-shimmer h-32 rounded-[1.8rem] border border-white/10 bg-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.2fr_1fr]">
          <div className="skeleton-shimmer h-[34rem] rounded-[2rem] border border-white/10 bg-white/5" />
          <div className="skeleton-shimmer h-[34rem] rounded-[2rem] border border-white/10 bg-white/5" />
          <div className="skeleton-shimmer h-[34rem] rounded-[2rem] border border-white/10 bg-white/5" />
        </div>
        <div className="skeleton-shimmer h-72 rounded-[2rem] border border-white/10 bg-white/5" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <MetricCard
          label="Questions Completed"
          value={session ? `${completedQuestions}/${questions.length || 0}` : '0/0'}
          helper="Track your progress through the current interview session."
          icon={CheckCircle2}
        />
        <MetricCard
          label="Confidence Score"
          value={`${confidenceMetric}%`}
          helper="Based on the latest AI answer evaluation."
          icon={BrainCircuit}
        />
        <MetricCard
          label="Session Duration"
          value={formatDuration(elapsedSeconds)}
          helper="Live timer since the current session started."
          icon={Clock3}
        />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.2fr_1fr]"
      >
        <motion.div whileHover={{ y: -4 }} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Question Card</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Current question</h3>
            </div>
            <Sparkles className="h-5 w-5 text-purple-300" />
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Progress</span>
              <span>{progressLabel}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.max(progressRatio * 100, session ? 12 : 0)}%` }}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
              <span>Timer</span>
              <span>{formatDuration(elapsedSeconds)}</span>
            </div>

            {currentQuestion && !completed ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {currentQuestion.type}
                </div>
                <h4 className="mt-3 text-xl font-semibold text-white">{currentQuestion.question}</h4>
                {currentQuestion.answer_hint && <p className="mt-3 text-sm text-slate-300">Hint: {currentQuestion.answer_hint}</p>}
              </div>
            ) : completed ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-100">
                Interview complete. Review the summary below, then restart to practice again.
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-slate-300">
                Start the interview to load the next AI-generated question.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startSession}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200 transition-all duration-300 hover:bg-purple-500/20 disabled:opacity-60"
              >
                <Play className="h-4 w-4" />
                {session ? 'Restart Session' : 'Start Interview'}
              </button>
              {session && (
                <button
                  type="button"
                  onClick={restartSession}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-all duration-300 hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Voice Area</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Speak your answer</h3>
            </div>
            <Mic className={`h-5 w-5 ${isListening ? 'text-red-300' : 'text-purple-300'}`} />
          </div>

          <div className="mt-6 space-y-4">
            <VoiceRecorder onTranscript={setAnswer} onListeningChange={setIsListening} disabled={loading || !session || completed} />

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Transcript area</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Speak or type your response here..."
                rows="7"
                disabled={completed || !session}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-purple-400/50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
              <span>{isListening ? 'Listening...' : 'Ready for your response'}</span>
              <span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>

            <button
              type="button"
              onClick={submitAnswer}
              disabled={loading || !session || !answer.trim() || completed}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Evaluating...' : 'Evaluate Answer'}
              <ArrowRight className="h-4 w-4" />
            </button>

            {readyToAdvance && !completed && (
              <button
                type="button"
                onClick={advanceToNext}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white"
              >
                {nextQuestion ? 'Next Question' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Performance Panel</p>
              <h3 className="mt-2 text-xl font-semibold text-white">AI coaching signals</h3>
            </div>
            <Activity className="h-5 w-5 text-cyan-300" />
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Speaking pace</span>
                <span className="font-semibold text-white">{pace} wpm</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Confidence score</span>
                <span className="font-semibold text-white">{confidenceMetric}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500" style={{ width: `${confidenceMetric}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Communication quality</span>
                <span className="font-semibold text-white">{communicationMetric}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-500" style={{ width: `${communicationMetric}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Overall answer quality</span>
                <span className="font-semibold text-white">{qualityMetric}%</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>AI suggestions</span>
                <Sparkles className="h-4 w-4 text-purple-300" />
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-100">
                {(latestFeedback?.improvements || ['Complete an answer to receive coaching suggestions.']).slice(0, 4).map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.22)] backdrop-blur-xl"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Interview Summary</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Strengths, weaknesses, and next moves</h3>
          </div>
          {interviewSummaryFeedback && (
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300">
              Latest evaluation: {Number(interviewSummaryFeedback.score_out_of_10 || 0).toFixed(1)}/10
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SummaryList title="Strengths" items={summaryStrengths} tone="emerald" />
          <SummaryList title="Weaknesses" items={summaryWeaknesses} tone="amber" />
          <SummaryList title="Improvement Suggestions" items={summarySuggestions} tone="purple" />
        </div>

        <div className="mt-6">
          <InterviewFeedback feedback={interviewSummaryFeedback} />
        </div>
      </motion.section>
    </div>
  )
}