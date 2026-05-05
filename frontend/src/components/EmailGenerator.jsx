import React, { useState } from 'react'
import { Mail, Copy, Check } from 'lucide-react'

export default function EmailGenerator({ generateFollowUpEmail }) {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [context, setContext] = useState('')
  const [email, setEmail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!company.trim() || !role.trim()) return

    setLoading(true)
    const result = await generateFollowUpEmail(company, role, context)
    if (result.success) {
      setEmail(result.data)
    }
    setLoading(false)
  }

  const copyToClipboard = () => {
    if (email?.email_body) {
      const fullEmail = `Subject: ${email.subject_line}\n\n${email.email_body}`
      navigator.clipboard.writeText(fullEmail)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReset = () => {
    setCompany('')
    setRole('')
    setContext('')
    setEmail(null)
  }

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-card/60 p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="w-5 h-5 text-purple-glow" />
        <h2 className="text-lg font-bold text-dark-text">Follow-Up Email Generator</h2>
      </div>

      {!email ? (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Company Name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm focus:outline-none focus:border-purple-glow"
          />
          <input
            type="text"
            placeholder="Job Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm focus:outline-none focus:border-purple-glow"
          />
          <textarea
            placeholder="Additional context (optional)"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm focus:outline-none focus:border-purple-glow"
            rows="2"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !company.trim() || !role.trim()}
            className="w-full px-4 py-2 bg-purple-glow/20 border border-purple-glow rounded-lg hover:bg-purple-glow/30 disabled:opacity-50 transition-colors text-sm font-semibold"
          >
            {loading ? 'Generating...' : 'Generate Email'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-dark-muted">Generated Email</p>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 flex items-center gap-2 bg-dark-bg border border-dark-border rounded text-xs hover:border-purple-glow transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1 text-xs bg-dark-bg border border-dark-border rounded hover:border-purple-glow transition-colors"
              >
                Generate New
              </button>
            </div>
          </div>

          <div className="text-xs text-dark-muted mb-1">Confidence: <span className="text-purple-glow font-semibold">{(email.confidence * 100).toFixed(0)}%</span></div>

          <div className="bg-dark-bg/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-dark-muted mb-2">Subject:</p>
            <p className="text-sm text-dark-text mb-3 italic">{email.subject_line}</p>

            <p className="text-xs font-semibold text-dark-muted mb-2">Body:</p>
            <p className="text-sm text-dark-text whitespace-pre-wrap">{email.email_body}</p>
          </div>
        </div>
      )}
    </div>
  )
}
