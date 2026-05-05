import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Send } from 'lucide-react'

export default function InterviewAnalyzer({ analyzeInterviewAnswer }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!question.trim() || !answer.trim()) return

    setLoading(true)
    const result = await analyzeInterviewAnswer(question, answer)
    if (result.success) {
      setAnalysis(result.data)
    }
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-card/60 p-6 mb-8">
      <h2 className="text-lg font-bold text-dark-text mb-4">Interview Answer Analyzer</h2>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs font-semibold text-dark-muted block mb-2">Interview Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Paste the interview question here..."
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm focus:outline-none focus:border-purple-glow"
            rows="2"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-dark-muted block mb-2">Your Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Paste your answer here..."
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm focus:outline-none focus:border-purple-glow"
            rows="4"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !question.trim() || !answer.trim()}
          className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-purple-glow/20 border border-purple-glow rounded-lg hover:bg-purple-glow/30 disabled:opacity-50 transition-colors text-sm font-semibold"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Analyzing...' : 'Analyze Answer'}
        </button>
      </div>

      {analysis && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-bg/30 rounded-lg p-3">
              <p className="text-xs text-dark-muted mb-1">Strength Score</p>
              <p className="text-2xl font-bold text-purple-glow">{analysis.strength_score}%</p>
            </div>
            <div className="bg-dark-bg/30 rounded-lg p-3">
              <p className="text-xs text-dark-muted mb-1">Confidence</p>
              <p className="text-2xl font-bold text-blue-glow">{(analysis.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>

          {analysis.has_issues && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm font-semibold text-red-300">Issues Detected</p>
              </div>
              <ul className="space-y-1">
                {analysis.issues?.map((issue, idx) => (
                  <li key={idx} className="text-xs text-red-200">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.improvements?.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <p className="text-sm font-semibold text-green-300">Suggestions</p>
              </div>
              <ul className="space-y-1">
                {analysis.improvements.map((improvement, idx) => (
                  <li key={idx} className="text-xs text-green-200">
                    • {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              setQuestion('')
              setAnswer('')
              setAnalysis(null)
            }}
            className="w-full px-3 py-2 text-xs bg-dark-bg border border-dark-border rounded-lg hover:border-purple-glow transition-colors"
          >
            Analyze Another Answer
          </button>
        </div>
      )}
    </div>
  )
}
