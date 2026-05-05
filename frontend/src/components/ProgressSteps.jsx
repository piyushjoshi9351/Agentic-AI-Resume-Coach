import React, { useEffect, useState } from 'react'
import { FileText, Zap, PenTool, HelpCircle } from 'lucide-react'

const AGENTS = [
  {
    id: 1,
    name: 'Resume Analyzer',
    description: 'Analyzing your resume...',
    icon: FileText,
    color: 'from-purple-glow to-purple-600',
  },
  {
    id: 2,
    name: 'Job Matcher',
    description: 'Matching against job description...',
    icon: Zap,
    color: 'from-purple-500 to-blue-500',
  },
  {
    id: 3,
    name: 'Cover Letter Writer',
    description: 'Generating cover letter...',
    icon: PenTool,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 4,
    name: 'Interview Coach',
    description: 'Creating interview questions...',
    icon: HelpCircle,
    color: 'from-cyan-500 to-blue-glow',
  },
]

export default function ProgressSteps({ isLoading }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setActiveStep(0)
      return
    }

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= AGENTS.length - 1) return prev
        return prev + 1
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div className="mt-12 mb-12 animate-fadeInUp">
      <h3 className="text-lg font-semibold text-dark-text mb-8 text-center">AI Agents Processing</h3>
      
      <div className="space-y-4">
        {AGENTS.map((agent, idx) => {
          const Icon = agent.icon
          const isActive = idx <= activeStep
          const isCurrentStep = idx === activeStep

          return (
            <div
              key={agent.id}
              className={`animate-scaleIn transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}
              style={{ animationDelay: `${idx * 0.2}s` }}
            >
              <div className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                isCurrentStep
                  ? 'border-purple-glow bg-gradient-to-r from-purple-glow/10 to-blue-glow/10 shadow-glow'
                  : isActive
                  ? 'border-purple-glow/50 bg-dark-card/50'
                  : 'border-dark-border bg-dark-card/30'
              }`}>
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isCurrentStep
                    ? `bg-gradient-to-br ${agent.color} animate-pulse`
                    : isActive
                    ? `bg-gradient-to-br ${agent.color}`
                    : 'bg-dark-border'
                }`}>
                  <Icon className={`w-6 h-6 ${isCurrentStep || isActive ? 'text-white' : 'text-dark-muted'}`} />
                </div>
                
                <div className="flex-1">
                  <p className="font-semibold text-dark-text">{agent.name}</p>
                  <p className={`text-sm transition-colors ${isCurrentStep ? 'text-purple-glow animate-pulse' : isActive ? 'text-dark-muted' : 'text-dark-muted'}`}>
                    {isCurrentStep ? agent.description : isActive ? 'Done ✓' : 'Waiting...'}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {isActive && !isCurrentStep && (
                    <div className="w-6 h-6 flex items-center justify-center bg-green-500/20 rounded-full border border-green-500/50">
                      <span className="text-green-500 text-sm font-bold">✓</span>
                    </div>
                  )}
                  {isCurrentStep && (
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-glow rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-purple-glow rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-purple-glow rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
