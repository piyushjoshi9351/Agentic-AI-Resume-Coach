import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AnalysisHistoryProvider } from './context/AnalysisHistoryContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import PageTransition from './components/PageTransition'
import Cursor from './components/Cursor'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'
import Results from './pages/Results'
import History from './pages/History'
import Interview from './pages/Interview'
import Tools from './pages/Tools'
import JobTracker from './pages/JobTracker'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname} className="min-h-screen">
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/results/:analysisId?" element={<Results />} />
            <Route path="/history" element={<History />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/job-tracker" element={<JobTracker />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AnalysisHistoryProvider>
        <BrowserRouter>
          <Cursor />
          <AnimatedRoutes />
        </BrowserRouter>
      </AnalysisHistoryProvider>
    </AuthProvider>
  )
}