import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, Zap, PenTool, HelpCircle, Copy, Download, Check, ChevronDown, ChevronUp } from 'lucide-react'
import ATSGauge from './dashboard/ATSGauge'
import SkillMatchChart from './dashboard/SkillMatchChart'
import MissingSkills from './dashboard/MissingSkills'
import SimilarityBreakdown from './dashboard/SimilarityBreakdown'
import ResumeStrength from './dashboard/ResumeStrength'

export default function ResultsTabs({ results }) {
  const [activeTab, setActiveTab] = useState(0)
  const [expandedQuestion, setExpandedQuestion] = useState(null)
  const [copiedKey, setCopiedKey] = useState('')
  const [animatedScore, setAnimatedScore] = useState(0)
  const finalScore = useMemo(() => Number(results.job_match?.ats_match_score || 0), [results.job_match?.ats_match_score])
  const scoreBreakdown = results.job_match?.score_breakdown || {}
  const matchingSkills = results.job_match?.matching_skills || []
  const missingSkills = results.job_match?.missing_skills || []

  const tabs = [
    { id: 0, label: 'Resume Analysis', icon: FileText },
    { id: 1, label: 'ATS Match', icon: Zap },
    { id: 2, label: 'Cover Letter', icon: PenTool },
    { id: 3, label: 'Interview Prep', icon: HelpCircle },
  ]

  const handleCopyToClipboard = async (text) => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }

  const handleCopyState = (key) => {
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 1800)
  }

  const handleDownloadCoverLetter = () => {
    const element = document.createElement('a')
    const file = new Blob([results.cover_letter], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'cover-letter.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  useEffect(() => {
    if (activeTab !== 1) return undefined
    let frameId
    const duration = 1200
    const startTime = performance.now()

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(finalScore * eased))
      if (progress < 1) frameId = window.requestAnimationFrame(tick)
    }

    setAnimatedScore(0)
    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [activeTab, finalScore])

  const resumeSummaryText = JSON.stringify(results.resume_analysis || {}, null, 2)
  const interviewSummaryText = JSON.stringify(results.interview_questions || [], null, 2)

  return (
    <div className="mt-12 animate-fadeInUp">
      <div className="mb-8 border-b border-dark-border pb-4 overflow-x-auto">
        <div className="flex flex-nowrap gap-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'gradient-purple-blue text-white shadow-glow'
                    : 'text-dark-muted hover:text-dark-text hover:bg-dark-card'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.22 }}
        className="min-h-96"
      >
        {activeTab === 0 && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  handleCopyToClipboard(resumeSummaryText)
                  handleCopyState('resume')
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg hover:border-purple-glow transition-all duration-300"
              >
                {copiedKey === 'resume' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span className="text-sm">{copiedKey === 'resume' ? 'Copied!' : 'Copy Resume Analysis'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-dark-card border border-dark-border rounded-2xl hover:border-purple-glow/50 transition-all duration-300">
                <h3 className="text-lg font-semibold text-dark-text mb-4">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {results.resume_analysis?.skills?.technical?.slice(0, 8).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-purple-glow/20 to-blue-glow/20 border border-purple-glow/30 text-purple-glow rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-dark-card border border-dark-border rounded-2xl hover:border-purple-glow/50 transition-all duration-300">
                <h3 className="text-lg font-semibold text-dark-text mb-4">Soft Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {results.resume_analysis?.skills?.soft_skills?.slice(0, 6).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-blue-glow/20 to-cyan-500/20 border border-blue-glow/30 text-blue-400 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-dark-card border border-dark-border rounded-2xl">
              <h3 className="text-lg font-semibold text-dark-text mb-4">Work Experience</h3>
              <div className="space-y-4">
                {results.resume_analysis?.experience?.slice(0, 3).map((exp, idx) => (
                  <div key={idx} className="border-l-4 border-purple-glow/50 pl-4 pb-4 last:pb-0">
                    <p className="font-semibold text-dark-text">{exp.job_title}</p>
                    <p className="text-sm text-dark-muted">{exp.company} • {exp.duration}</p>
                    <ul className="mt-2 text-sm text-dark-text space-y-1">
                      {exp.key_achievements?.slice(0, 2).map((achievement, aidx) => (
                        <li key={aidx} className="flex gap-2">
                          <span className="text-purple-glow">•</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-dark-card border border-dark-border rounded-2xl">
                <h3 className="text-lg font-semibold text-green-400 mb-4">Strengths</h3>
                <ul className="space-y-3">
                  {results.resume_analysis?.strengths?.slice(0, 4).map((item, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <div>
                        <p className="font-medium text-dark-text">{item.strength}</p>
                        <p className="text-xs text-dark-muted">{item.evidence}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-dark-card border border-dark-border rounded-2xl">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Areas to Improve</h3>
                <ul className="space-y-3">
                  {results.resume_analysis?.weaknesses?.slice(0, 4).map((item, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-yellow-500 mt-1">⚠</span>
                      <div>
                        <p className="font-medium text-dark-text">{item.weakness}</p>
                        <p className="text-xs text-dark-muted">{item.recommendation}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-6 animate-fadeInUp">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ATSGauge score={animatedScore} matchLevel={results.job_match?.match_level} breakdown={scoreBreakdown} />
              <ResumeStrength
                resumeAnalysis={results.resume_analysis}
                scoreBreakdown={scoreBreakdown}
                impactLine="Built interactive analytics dashboard for ATS insights and skill-gap visualization."
                matchLevel={results.job_match?.match_level}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SkillMatchChart resumeSkills={results.resume_analysis?.skills?.technical || []} matchingSkills={matchingSkills} />
              <SimilarityBreakdown matchingSkills={matchingSkills} />
            </div>

            <MissingSkills missingSkills={missingSkills} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-dark-card border border-dark-border rounded-2xl">
                <h3 className="text-lg font-semibold text-dark-text mb-4">Matching Skills</h3>
                <div className="space-y-2">
                  {matchingSkills.slice(0, 6).map((skill, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-green-500/30">
                      <div>
                        <p className="text-dark-text font-medium">{skill.skill}</p>
                        <p className="text-xs text-dark-muted">{skill.proficiency_evidence}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-dark-muted bg-dark-card px-2 py-1 rounded">{skill.importance}</span>
                        <span className="text-sm font-semibold text-green-400">
                          {typeof skill.similarity_score === 'number' ? skill.similarity_score.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-dark-card border border-dark-border rounded-2xl space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">Overall Assessment</h3>
                  <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-glow to-blue-glow bg-clip-text">
                    {results.job_match?.match_level}
                  </p>
                </div>

                <div className="rounded-xl border border-dark-border bg-dark-bg/70 p-4">
                  <p className="text-sm font-medium text-dark-text mb-2">Recommendation</p>
                  <p className="text-sm text-dark-muted leading-relaxed">{results.job_match?.recommendation}</p>
                </div>

                <div className="rounded-xl border border-dark-border bg-dark-bg/70 p-4">
                  <p className="text-sm font-medium text-dark-text mb-2">Experience Fit</p>
                  <p className="text-sm text-dark-muted leading-relaxed">{results.job_match?.experience_analysis?.analysis}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-purple-glow/20 to-blue-glow/20 border border-purple-glow/50 rounded-2xl">
              <h3 className="font-semibold text-dark-text mb-2">Weighted Score Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-xl bg-dark-bg/70 border border-dark-border p-3">
                  <p className="text-dark-muted">Skills</p>
                  <p className="text-xl font-bold text-dark-text">{Number(scoreBreakdown.skill_score || 0).toFixed(1)}</p>
                </div>
                <div className="rounded-xl bg-dark-bg/70 border border-dark-border p-3">
                  <p className="text-dark-muted">Experience</p>
                  <p className="text-xl font-bold text-dark-text">{Number(scoreBreakdown.experience_score || 0).toFixed(1)}</p>
                </div>
                <div className="rounded-xl bg-dark-bg/70 border border-dark-border p-3">
                  <p className="text-dark-muted">Projects</p>
                  <p className="text-xl font-bold text-dark-text">{Number(scoreBreakdown.project_score || 0).toFixed(1)}</p>
                </div>
                <div className="rounded-xl bg-dark-bg/70 border border-dark-border p-3">
                  <p className="text-dark-muted">Education</p>
                  <p className="text-xl font-bold text-dark-text">{Number(scoreBreakdown.education_score || 0).toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4 animate-fadeInUp">
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => {
                  handleCopyToClipboard(results.cover_letter)
                  handleCopyState('cover')
                }}
                className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg hover:border-purple-glow transition-all duration-300"
              >
                {copiedKey === 'cover' ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadCoverLetter}
                className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg hover:border-purple-glow transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </button>
            </div>

            <div className="p-8 bg-dark-card border border-dark-border rounded-2xl prose prose-invert max-w-none">
              <div className="text-dark-text whitespace-pre-wrap leading-relaxed">
                {results.cover_letter}
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-3 animate-fadeInUp">
            <div className="flex justify-end pb-2">
              <button
                onClick={() => {
                  handleCopyToClipboard(interviewSummaryText)
                  handleCopyState('interview')
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg hover:border-purple-glow transition-all duration-300"
              >
                {copiedKey === 'interview' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span className="text-sm">{copiedKey === 'interview' ? 'Copied!' : 'Copy Interview Questions'}</span>
              </button>
            </div>

            {results.interview_questions?.map((question, idx) => (
              <div
                key={idx}
                className="border border-dark-border rounded-xl overflow-hidden hover:border-purple-glow/50 transition-all duration-300"
              >
                <button
                  onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 bg-dark-card hover:bg-dark-card/80 transition-colors"
                >
                  <div className="flex items-start gap-4 text-left">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-glow to-blue-glow flex items-center justify-center font-bold text-white text-sm">
                        {idx + 1}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-muted">{question.type}</p>
                      <p className="text-dark-text font-semibold mt-1 pr-8">{question.question}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {expandedQuestion === idx ? (
                      <ChevronUp className="w-5 h-5 text-purple-glow" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-dark-muted" />
                    )}
                  </div>
                </button>

                {expandedQuestion === idx && (
                  <div className="border-t border-dark-border p-6 bg-dark-bg/50 space-y-4 animate-slideDown">
                    <div>
                      <h4 className="font-semibold text-dark-text mb-2">Answer Framework:</h4>
                      <p className="text-dark-text text-sm">{question.answer_framework}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark-text mb-2">Strong Answer Example:</h4>
                      <p className="text-dark-text text-sm">{question.strong_answer_example}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark-text mb-2">Key Points to Cover:</h4>
                      <ul className="list-disc list-inside text-dark-text text-sm space-y-1">
                        {question.key_points_to_cover?.map((point, pidx) => (
                          <li key={pidx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark-text mb-2">Common Mistakes:</h4>
                      <ul className="list-disc list-inside text-dark-text text-sm space-y-1">
                        {question.common_mistakes?.map((mistake, midx) => (
                          <li key={midx}>{mistake}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark-text mb-2">Follow-up Questions:</h4>
                      <ul className="list-disc list-inside text-dark-text text-sm space-y-1">
                        {question.follow_up_questions?.map((followUp, fidx) => (
                          <li key={fidx}>{followUp}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark-text mb-2">Tips:</h4>
                      <p className="text-dark-text text-sm">{question.tips}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
      </AnimatePresence>
    </div>
  )
}