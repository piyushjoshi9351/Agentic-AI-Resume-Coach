import React from 'react'
import { Sparkles, Loader } from 'lucide-react'

export default function AnalyzeButton({ isLoading, isValid, onClick }) {
  return (
    <div className="mt-8 animate-fadeInUp">
      <button
        onClick={onClick}
        disabled={!isValid || isLoading}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 transform ${
          isValid && !isLoading
            ? 'gradient-purple-blue hover:gradient-purple-blue-hover shadow-glow hover:shadow-glow-lg hover:scale-105 active:scale-95 cursor-pointer'
            : 'bg-dark-border text-dark-muted cursor-not-allowed opacity-50'
        } ${isLoading ? 'pulse-glow' : ''}`}
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Analyzing with AI Agents...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span className="text-white">Start AI Analysis</span>
          </>
        )}
      </button>
      
      {!isValid && (
        <p className="text-center text-dark-muted text-sm mt-3">
          Upload a resume PDF and enter a job description to analyze
        </p>
      )}
      
      {isLoading && (
        <p className="text-center text-dark-muted text-sm mt-3 animate-pulse">
          First request takes 30-60 seconds as AI agents process your data...
        </p>
      )}
    </div>
  )
}
