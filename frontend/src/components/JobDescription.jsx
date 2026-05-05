import React from 'react'
import { FileText } from 'lucide-react'

const EXAMPLE_JOB = `Senior Software Engineer - Backend

About the Role:
We're looking for an experienced Backend Engineer to lead our infrastructure team.

Responsibilities:
- Design and build scalable APIs and microservices
- Mentor junior engineers
- Optimize system performance
- Collaborate with product teams

Requirements:
- 5+ years of backend development
- Strong knowledge of Python or similar
- Experience with cloud platforms
- System design expertise`

export default function JobDescription({ jobDescription, setJobDescription, error }) {
  const charCount = jobDescription.length
  const maxChars = 5000

  return (
    <div className="animate-fadeInRight">
      <label className="block text-sm font-semibold text-dark-text mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Job Description
      </label>

      <div className="relative">
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value.slice(0, maxChars))}
          placeholder={EXAMPLE_JOB}
          maxLength={maxChars}
          className="w-full h-64 px-6 py-4 bg-dark-card border-2 border-dark-border rounded-2xl text-dark-text placeholder-dark-muted focus:outline-none focus:border-purple-glow transition-all duration-300 resize-none focus:shadow-glow focus:bg-dark-card/80"
        />
        
        <div className="absolute bottom-4 right-4 text-xs text-dark-muted font-medium">
          {charCount} / {maxChars}
        </div>
      </div>

      <div className="mt-3 text-xs text-dark-muted">
        💡 Paste the complete job description including responsibilities and requirements
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 animate-slideDown">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
