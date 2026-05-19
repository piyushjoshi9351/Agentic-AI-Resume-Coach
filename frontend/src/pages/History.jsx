import React, { useEffect, useState } from 'react'
import { getAtsHistory, getInterviewHistory } from '../services/api'

export default function History() {
  const [ats, setAts] = useState([])
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [atsRes, intRes] = await Promise.all([getAtsHistory(), getInterviewHistory()])
      if (atsRes.success) setAts(atsRes.data)
      if (intRes.success) setInterviews(intRes.data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div>Loading history...</div>

  return (
    <div style={{ padding: 20 }}>
      <h2>ATS Reports</h2>
      {ats.length === 0 ? (
        <div>No ATS reports yet.</div>
      ) : (
        <ul>
          {ats.map((r) => (
            <li key={r.id}>
              <strong>{new Date(r.created_at).toLocaleString()}</strong> — ATS: {r.ats_score || 'N/A'} — Matched: {(r.matched_skills || []).length}
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ marginTop: 24 }}>Interview Feedback</h2>
      {interviews.length === 0 ? (
        <div>No interview attempts yet.</div>
      ) : (
        <ul>
          {interviews.map((s) => (
            <li key={s.id}>
              <strong>{new Date(s.created_at).toLocaleString()}</strong> — Score: {s.score || 'N/A'}
              <div style={{ fontSize: 13, color: '#444' }}>{typeof s.feedback === 'object' ? JSON.stringify(s.feedback) : s.feedback}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
