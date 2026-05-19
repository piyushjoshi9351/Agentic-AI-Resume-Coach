import React, { useState } from 'react'
import { Search, Briefcase, MapPin, Building2, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'

const EXAMPLE_QUERY = 'AI Engineer Intern'

function truncateText(text, maxLength = 180) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}...`
}

export default function JobSearch({ searchJobs, onSelectJob, selectedJobKey = '' }) {
  const [query, setQuery] = useState(EXAMPLE_QUERY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [lastSearch, setLastSearch] = useState('')

  const runSearch = async (searchTerm = query) => {
    const trimmedQuery = searchTerm.trim()
    if (!trimmedQuery) {
      setError('Enter a role to search live jobs')
      return
    }

    setLoading(true)
    setError('')
    const result = await searchJobs(trimmedQuery)
    setLoading(false)

    if (!result.success) {
      setResults([])
      setError(result.error || 'Failed to search live jobs')
      return
    }

    setResults(Array.isArray(result.data) ? result.data : [])
    setLastSearch(trimmedQuery)
  }

  const handleSelect = (job) => {
    onSelectJob(job)
  }

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-card/70 p-5 shadow-xl shadow-black/10 animate-fadeInUp">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-purple-glow" />
            <h3 className="text-lg font-semibold text-white">Live Job Search</h3>
          </div>
          <p className="text-sm text-dark-muted max-w-2xl">
            Search real jobs from JSearch, select one, and auto-fill the job description for ATS analysis.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[520px]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                runSearch()
              }
            }}
            placeholder={EXAMPLE_QUERY}
            className="flex-1 px-4 py-3 rounded-xl bg-dark-bg border border-dark-border text-sm focus:outline-none focus:border-purple-glow"
          />
          <button
            type="button"
            onClick={() => runSearch()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-purple-blue text-white font-semibold disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search Jobs
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      {results.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-dark-muted">
              {results.length} live job{results.length !== 1 ? 's' : ''} for “{lastSearch}”
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((job, index) => {
              const jobKey = `${job.title}-${job.company}-${index}`
              const isSelected = selectedJobKey === jobKey

              return (
                <div
                  key={jobKey}
                  className={`rounded-2xl border p-4 transition-all duration-300 ${
                    isSelected
                      ? 'border-emerald-400/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      : 'border-dark-border bg-dark-bg/80 hover:border-purple-glow/40 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-purple-glow" />
                        <h4 className="font-semibold text-white leading-tight">{job.title || 'Untitled role'}</h4>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-dark-muted">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {job.company || 'Unknown company'}
                        </span>
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                        Selected
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-sm text-slate-300 leading-6">
                    {truncateText(job.description, 220) || 'No description returned by the API.'}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs text-dark-muted">
                      {job.employment_type ? `Employment: ${job.employment_type}` : 'Live job from JSearch'}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelect(job)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-medium hover:border-purple-glow transition-colors"
                    >
                      Select Job
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}