import React, { useState } from 'react'
import { Sparkles, Copy, Check } from 'lucide-react'

export default function ResumeImprover({ analysisId, improveResume, getResumeDiff }) {
  const [loading, setLoading] = useState(false)
  const [improved, setImproved] = useState(null)
  const [copied, setCopied] = useState(false)
  const [diff, setDiff] = useState(null)

  const handleImprove = async () => {
    setLoading(true)
    const result = await improveResume(analysisId)
    if (result.success) {
      setImproved(result.data)
      const diffResult = await getResumeDiff(analysisId)
      if (diffResult.success) {
        setDiff(diffResult.data)
      }
    }
    setLoading(false)
  }

  const copyToClipboard = () => {
    if (improved?.improved_text) {
      navigator.clipboard.writeText(improved.improved_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadResume = () => {
    if (improved?.improved_text) {
      const element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(improved.improved_text))
      element.setAttribute('download', 'improved-resume.txt')
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  if (!improved) {
    return (
      <div className="rounded-2xl border border-dark-border bg-dark-card/60 p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-glow" />
          <h2 className="text-lg font-bold text-dark-text">AI Resume Improver</h2>
        </div>
        <p className="text-sm text-dark-muted mb-4">Get AI-powered suggestions to improve your resume based on the job description.</p>
        <button
          onClick={handleImprove}
          disabled={loading}
          className="px-4 py-2 bg-purple-glow/20 border border-purple-glow rounded-lg hover:bg-purple-glow/30 disabled:opacity-50 transition-colors text-sm font-semibold"
        >
          {loading ? 'Generating...' : 'Generate Improved Resume'}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-card/60 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-dark-text">Improved Resume</h2>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="px-3 py-2 flex items-center gap-2 bg-dark-bg border border-dark-border rounded-lg hover:border-purple-glow transition-colors text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={downloadResume}
            className="px-3 py-2 bg-purple-glow/20 border border-purple-glow rounded-lg hover:bg-purple-glow/30 transition-colors text-sm font-semibold"
          >
            Download
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-dark-muted mb-2">
          Confidence Score: <span className="text-purple-glow font-semibold">{(improved.confidence_score * 100).toFixed(0)}%</span>
        </div>
        {improved.changes_summary?.length > 0 && (
          <div className="text-sm">
            <p className="text-dark-muted mb-2">Changes Made:</p>
            <ul className="list-disc list-inside space-y-1">
              {improved.changes_summary.map((change, idx) => (
                <li key={idx} className="text-xs text-dark-text">
                  {change}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-dark-bg/30 rounded-lg p-4 max-h-96 overflow-y-auto">
        <p className="text-sm whitespace-pre-wrap text-dark-text">{improved.improved_text}</p>
      </div>
    </div>
  )
}
