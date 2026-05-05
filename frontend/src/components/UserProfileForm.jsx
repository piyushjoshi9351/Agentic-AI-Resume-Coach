import React, { useState, useEffect } from 'react'
import { User, Save } from 'lucide-react'

export default function UserProfileForm({ updateUserProfile, getUserProfile }) {
  const [profile, setProfile] = useState({
    experienceLevel: 'mid',
    targetRole: '',
    location: '',
    salaryRange: '',
    language: 'en',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const result = await getUserProfile()
    if (result.success && result.data) {
      setProfile({
        experienceLevel: result.data.experience_level || 'mid',
        targetRole: result.data.target_role || '',
        location: result.data.location || '',
        salaryRange: result.data.salary_range || '',
        language: result.data.language || 'en',
      })
    }
  }

  const handleSave = async () => {
    setLoading(true)
    const result = await updateUserProfile(
      profile.experienceLevel,
      profile.targetRole,
      profile.location,
      profile.salaryRange,
      profile.language
    )
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-card/60 p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <User className="w-5 h-5 text-purple-glow" />
        <h2 className="text-lg font-bold text-dark-text">Profile Settings</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-dark-muted block mb-2">Experience Level</label>
          <select
            value={profile.experienceLevel}
            onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm focus:outline-none focus:border-purple-glow"
          >
            <option value="fresher">Fresher</option>
            <option value="mid">Mid-level</option>
            <option value="senior">Senior</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-dark-muted block mb-2">Target Role</label>
          <input
            type="text"
            placeholder="e.g., Software Engineer, Product Manager"
            value={profile.targetRole}
            onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm focus:outline-none focus:border-purple-glow"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-dark-muted block mb-2">Location</label>
          <input
            type="text"
            placeholder="e.g., San Francisco, CA"
            value={profile.location}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm focus:outline-none focus:border-purple-glow"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-dark-muted block mb-2">Salary Range</label>
          <input
            type="text"
            placeholder="e.g., $80k - $120k"
            value={profile.salaryRange}
            onChange={(e) => setProfile({ ...profile, salaryRange: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm focus:outline-none focus:border-purple-glow"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-dark-muted block mb-2">Language</label>
          <select
            value={profile.language}
            onChange={(e) => setProfile({ ...profile, language: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm focus:outline-none focus:border-purple-glow"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-purple-glow/20 border border-purple-glow rounded-lg hover:bg-purple-glow/30 disabled:opacity-50 transition-colors text-sm font-semibold"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Profile'}
        </button>

        {saved && <p className="text-xs text-green-400 text-center">Profile saved successfully!</p>}
      </div>
    </div>
  )
}
