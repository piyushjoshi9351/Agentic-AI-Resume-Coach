import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthPanel from '../components/AuthPanel'
import { getAuthToken } from '../lib/storage'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const navigate = useNavigate()
  const { login, register, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (getAuthToken() || isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, isAuthenticated])

  const handleLogin = async ({ email, password }) => {
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async ({ name, email, password }) => {
    setLoading(true)
    try {
      await register({ name, email, password })
      navigate('/dashboard', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Secure access</p>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">Login or create your workspace account.</h1>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              The same live auth flow is reused here, then the app routes you into the protected SaaS pages.
            </p>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm text-slate-300">
                After authentication you can access dashboard, analysis, results, interview prep, tools, and job tracker.
              </p>
            </div>
          </section>

          <AuthPanel onLogin={handleLogin} onRegister={handleRegister} loading={loading} />
        </div>
      </div>
    </div>
  )
}