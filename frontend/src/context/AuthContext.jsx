import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, loginUser, registerUser, setAuthToken } from '../services/api'
import { clearAuthStorage, clearLatestAnalysis, getAuthToken, setAuthTokenStorage } from '../lib/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(getAuthToken())
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = getAuthToken()
      if (!storedToken) {
        setAuthToken(null)
        setInitializing(false)
        return
      }

      setToken(storedToken)
      setAuthToken(storedToken)

      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch {
        clearAuthStorage()
        setAuthToken(null)
        setUser(null)
        setToken(null)
      } finally {
        setInitializing(false)
      }
    }

    bootstrap()
  }, [])

  const login = async ({ email, password }) => {
    const data = await loginUser({ email, password })
    setAuthTokenStorage(data.access_token)
    setAuthToken(data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const register = async ({ name, email, password }) => {
    const data = await registerUser({ name, email, password })
    setAuthTokenStorage(data.access_token)
    setAuthToken(data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    clearAuthStorage()
    clearLatestAnalysis()
    setAuthToken(null)
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
    return currentUser
  }

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, token, initializing],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}