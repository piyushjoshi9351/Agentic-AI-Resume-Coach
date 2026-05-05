import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'

export default function JobTrackerBoard({ getJobApplications, createJobApplication, updateJobApplication, deleteJobApplication }) {
  const [jobs, setJobs] = useState({ applied: [], interview: [], offer: [] })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [formData, setFormData] = useState({ company: '', role: '', status: 'applied', jobUrl: '', notes: '' })

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    const result = await getJobApplications()
    if (result.success) {
      const grouped = { applied: [], interview: [], offer: [] }
      result.data.forEach((job) => {
        if (grouped[job.status]) {
          grouped[job.status].push(job)
        }
      })
      setJobs(grouped)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.company.trim() || !formData.role.trim()) return

    let result
    if (editingJob) {
      result = await updateJobApplication(editingJob.id, formData.company, formData.role, formData.status, formData.jobUrl, formData.notes)
    } else {
      result = await createJobApplication(formData.company, formData.role, formData.status, formData.jobUrl, formData.notes)
    }

    if (result.success) {
      setFormData({ company: '', role: '', status: 'applied', jobUrl: '', notes: '' })
      setShowForm(false)
      setEditingJob(null)
      loadJobs()
    }
  }

  const handleDelete = async (jobId) => {
    if (window.confirm('Delete this job application?')) {
      const result = await deleteJobApplication(jobId)
      if (result.success) {
        loadJobs()
      }
    }
  }

  const openEdit = (job) => {
    setEditingJob(job)
    setFormData({
      company: job.company,
      role: job.role,
      status: job.status,
      jobUrl: job.job_url || '',
      notes: job.notes || '',
    })
    setShowForm(true)
  }

  const JobCard = ({ job }) => (
    <div className="p-3 bg-dark-card border border-dark-border rounded-lg mb-2 hover:border-purple-glow transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-dark-text">{job.role}</h4>
          <p className="text-xs text-dark-muted">{job.company}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => openEdit(job)} className="p-1 hover:bg-dark-bg rounded">
            <Edit2 className="w-3 h-3 text-blue-400" />
          </button>
          <button onClick={() => handleDelete(job.id)} className="p-1 hover:bg-dark-bg rounded">
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-card/60 p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-dark-text">Job Tracker</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingJob(null)
            setFormData({ company: '', role: '', status: 'applied', jobUrl: '', notes: '' })
          }}
          className="inline-flex items-center gap-2 px-3 py-2 bg-purple-glow/20 border border-purple-glow rounded-lg hover:bg-purple-glow/30 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-dark-bg/50 p-4 rounded-lg mb-6 border border-dark-border">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="px-2 py-2 bg-dark-card border border-dark-border rounded text-sm focus:outline-none focus:border-purple-glow"
            />
            <input
              type="text"
              placeholder="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="px-2 py-2 bg-dark-card border border-dark-border rounded text-sm focus:outline-none focus:border-purple-glow"
            />
          </div>
          <input
            type="url"
            placeholder="Job URL (optional)"
            value={formData.jobUrl}
            onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
            className="w-full px-2 py-2 bg-dark-card border border-dark-border rounded text-sm mb-3 focus:outline-none focus:border-purple-glow"
          />
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-2 py-2 bg-dark-card border border-dark-border rounded text-sm mb-3 focus:outline-none focus:border-purple-glow"
            rows="2"
          />
          <button
            type="submit"
            className="w-full px-3 py-2 bg-purple-glow text-dark-bg rounded font-semibold hover:bg-purple-glow/90 transition-colors text-sm"
          >
            {editingJob ? 'Update' : 'Add'} Job
          </button>
        </form>
      )}

      <div className="grid grid-cols-3 gap-6">
        {['applied', 'interview', 'offer'].map((status) => (
          <div key={status}>
            <h3 className="font-semibold text-sm text-dark-text mb-4 capitalize">{status} ({jobs[status]?.length || 0})</h3>
            <div className="space-y-2">{jobs[status]?.map((job) => <JobCard key={job.id} job={job} />)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
