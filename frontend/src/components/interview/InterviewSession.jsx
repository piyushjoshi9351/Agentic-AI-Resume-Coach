import React, { useEffect, useMemo, useState } from 'react'
import { Play, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react'
import VoiceRecorder from './VoiceRecorder'
import InterviewFeedback from './InterviewFeedback'
import { getInterviewSessionState } from '../../services/api'

export default function InterviewSession({ analysisId, startInterviewSession, evaluateInterviewAnswer }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [readyToAdvance, setReadyToAdvance] = useState(false)
  const [nextQuestion, setNextQuestion] = useState(null)

  const questions = session?.questions || []
  const currentIndex = session?.current_index ?? 0
  const currentQuestion = questions[currentIndex]
  const completed = Boolean(session && currentIndex >= questions.length)

  const progressLabel = useMemo(() => {
    if (!session) return '0 / 0'
    return `${Math.min(currentIndex + 1, questions.length)} / ${questions.length}`
  }, [currentIndex, questions.length, session])

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
      setAnswer('')
      setReadyToAdvance(false)
      setNextQuestion(null)
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (analysisId) {
      setSession(null)
      setAnswer('')
      setFeedback(null)
      setReadyToAdvance(false)
      setNextQuestion(null)
      const savedSessionId = localStorage.getItem(`interview-session:${analysisId}`)
      if (savedSessionId) {
        getInterviewSessionState(savedSessionId).then((result) => {
          if (result.success) {
            setSession(result.data)
          }
        })
      }
    }
  }, [analysisId])

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
    if (analysisId) {
      localStorage.removeItem(`interview-session:${analysisId}`)
    }
  }

  return (
    <section className="rounded-3xl border border-dark-border bg-dark-card/70 p-6 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-dark-muted">Voice Mock Interview</p>
          <h2 className="mt-2 text-2xl font-bold text-dark-text">Practice with real ATS context</h2>
          <p className="mt-2 max-w-2xl text-sm text-dark-muted">
            Questions are generated from your resume, the ATS gaps, and your prior analysis history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startSession}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-glow/40 bg-purple-glow/10 px-4 py-2 text-sm font-semibold text-purple-200 transition-all duration-300 hover:bg-purple-glow/20 disabled:opacity-60"
          >
            <Play className="h-4 w-4" />
            {session ? 'Restart' : 'Start Interview'}
          </button>
          {session && (
            <button
              type="button"
              onClick={restartSession}
              className="inline-flex items-center gap-2 rounded-xl border border-dark-border bg-dark-bg/70 px-4 py-2 text-sm font-semibold text-dark-text transition-all duration-300 hover:border-purple-glow"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {!analysisId && (
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Save an analysis first so the interview can use the ATS result and history.
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {session && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dark-border bg-dark-bg/60 px-4 py-3 text-sm text-dark-muted">
            <span>Question progress</span>
            <span>{progressLabel}</span>
          </div>

          {currentQuestion && !completed ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dark-border bg-dark-bg/60 p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {currentQuestion.type}
                </div>
                <h3 className="mt-3 text-xl font-semibold text-white">{currentQuestion.question}</h3>
                {currentQuestion.answer_hint && (
                  <p className="mt-3 text-sm text-dark-muted">Hint: {currentQuestion.answer_hint}</p>
                )}
              </div>

              <VoiceRecorder onTranscript={setAnswer} disabled={loading} />

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-muted">Your answer</label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Speak or type your response here..."
                  rows="6"
                  className="w-full rounded-2xl border border-dark-border bg-dark-bg/70 px-4 py-3 text-sm text-dark-text outline-none transition-all duration-300 focus:border-purple-glow"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-glow to-blue-glow px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Evaluate Answer
                  <ArrowRight className="h-4 w-4" />
                </button>

                {readyToAdvance && !completed && (
                  <button
                    type="button"
                    onClick={advanceToNext}
                    className="inline-flex items-center gap-2 rounded-xl border border-dark-border bg-dark-bg/70 px-5 py-3 text-sm font-semibold text-dark-text"
                  >
                    {nextQuestion ? 'Next Question' : 'Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              <InterviewFeedback feedback={feedback} />
            </div>
          ) : completed ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-100">
              Interview complete. Review your feedback, then restart to practice again.
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}