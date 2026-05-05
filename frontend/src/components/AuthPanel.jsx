import React, { useState } from 'react'
import { Lock, Mail, User, LogIn, UserPlus } from 'lucide-react'

export default function AuthPanel({ onLogin, onRegister, loading }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    if (mode === 'register' && !name.trim()) {
      setError('Name is required')
      return
    }

    try {
      if (mode === 'login') {
        await onLogin({ email, password })
      } else {
        await onRegister({ name: name.trim(), email, password })
      }
    } catch (submitError) {
      setError(submitError?.response?.data?.detail || 'Authentication failed')
    }
  }

  return (
    <section className="mb-10 animate-fadeInUp">
      <div className="max-w-xl mx-auto border border-dark-border bg-dark-card/80 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-purple-glow" />
          <h2 className="text-xl font-semibold text-dark-text">Secure Account Access</h2>
        </div>

        <div className="flex rounded-xl bg-dark-bg p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`w-1/2 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'login' ? 'gradient-purple-blue text-white' : 'text-dark-muted'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`w-1/2 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'register' ? 'gradient-purple-blue text-white' : 'text-dark-muted'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="relative">
              <User className="w-4 h-4 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-dark-border bg-dark-bg text-dark-text focus:outline-none focus:border-purple-glow"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="w-4 h-4 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-10 pr-3 py-3 rounded-xl border border-dark-border bg-dark-bg text-dark-text focus:outline-none focus:border-purple-glow"
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)"
              className="w-full pl-10 pr-3 py-3 rounded-xl border border-dark-border bg-dark-bg text-dark-text focus:outline-none focus:border-purple-glow"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl gradient-purple-blue text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed inline-flex justify-center items-center gap-2"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {loading ? 'Please wait...' : mode === 'login' ? 'Login to Continue' : 'Create Account'}
          </button>
        </form>
      </div>
    </section>
  )
}
