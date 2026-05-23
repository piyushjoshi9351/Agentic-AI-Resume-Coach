import React from 'react'
import { Link } from 'react-router-dom'
import JobParserPanel from '../components/JobParserPanel'
import ResumeImprover from '../components/ResumeImprover'
import EmailGenerator from '../components/EmailGenerator'
import UserProfileForm from '../components/UserProfileForm'
import { parseJobUrl, improveResume, getResumeDiff, generateFollowUpEmail, updateUserProfile, getUserProfile } from '../services/api'
import { getLatestAnalysisId } from '../lib/storage'

export default function Tools() {
  const analysisId = getLatestAnalysisId()

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Tools</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Workflow tools powered by the live backend</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
          Parse job URLs, improve resumes, generate follow-up emails, and update profile settings without leaving the app.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <JobParserPanel parseJobUrl={parseJobUrl} onParsed={() => {}} />
        <EmailGenerator generateFollowUpEmail={generateFollowUpEmail} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {analysisId ? (
          <ResumeImprover analysisId={Number(analysisId)} improveResume={improveResume} getResumeDiff={getResumeDiff} />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
            Run an analysis first to unlock the resume improver.
            <div className="mt-4">
              <Link to="/analyze" className="rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white">
                Go to Analyze
              </Link>
            </div>
          </div>
        )}

        <UserProfileForm updateUserProfile={updateUserProfile} getUserProfile={getUserProfile} />
      </div>
    </div>
  )
}