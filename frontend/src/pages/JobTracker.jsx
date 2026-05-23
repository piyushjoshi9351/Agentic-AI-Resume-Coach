import React from 'react'
import JobTrackerBoard from '../components/JobTrackerBoard'
import { createJobApplication, deleteJobApplication, getJobApplications, updateJobApplication } from '../services/api'

export default function JobTracker() {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Job Tracker</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Track roles across applied, interview, and offer stages</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
          This page reuses the existing job tracker board and the live job application APIs.
        </p>
      </section>

      <JobTrackerBoard
        getJobApplications={getJobApplications}
        createJobApplication={createJobApplication}
        updateJobApplication={updateJobApplication}
        deleteJobApplication={deleteJobApplication}
      />
    </div>
  )
}