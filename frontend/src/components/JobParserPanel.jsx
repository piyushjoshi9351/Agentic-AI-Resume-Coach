import React, { useState } from 'react'
import { Link2, Loader2, CheckCircle2 } from 'lucide-react'

export default function JobParserPanel({ onParsed, parseJobUrl }) {
  const [jobUrl, setJobUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  const handleParse = async () => {
    setError('')
    if (!jobUrl.trim()) {
      setError('Please enter a valid job URL')
      return
    }

    setLoading(true)
    const result = await parseJobUrl(jobUrl.trim())
    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to parse URL')
      return
    }

    setPreview(result.data)
    onParsed({ jobUrl: jobUrl.trim(), parsedJobData: result.data })
  }

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-card/60 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-purple-glow" />
        <h3 className="text-sm font-semibold">Job URL Parser</h3>
      </div>
      <p className="text-xs text-dark-muted mb-4">
        Paste a job post URL to auto-extract title, company, skills, and responsibilities.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="https://company.com/jobs/software-engineer"
          className="flex-1 px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-sm focus:outline-none focus:border-purple-glow"
        />
        <button
          type="button"
          onClick={handleParse}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-dark-bg border border-dark-border hover:border-purple-glow transition-colors text-sm inline-flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          Parse URL
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

      {preview && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2 text-emerald-300 text-xs mb-2">
            <CheckCircle2 className="w-4 h-4" />
            Parsed successfully
          </div>
          <div className="text-sm text-dark-text font-medium">{preview.title || 'Untitled role'}</div>
          <div className="text-xs text-dark-muted mt-1">
            {preview.company || 'Unknown company'}
            {preview.location ? ` · ${preview.location}` : ''}
          </div>
        </div>
      )}
    </div>
  )
}
