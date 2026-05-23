import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100"
      style={{ '--sidebar-width': collapsed ? '5.5rem' : '18rem' }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[-10rem] top-[-10rem] h-80 w-80 rounded-full bg-purple-500/10 blur-3xl"
          animate={{ x: [0, 24, 0], y: [0, 18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[-8rem] top-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"
          animate={{ x: [0, -18, 0], y: [0, 24, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/5 blur-3xl"
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((prev) => !prev)} />

      <main className="min-h-screen px-4 py-6 pb-28 transition-all duration-300 xl:pl-[var(--sidebar-width)] xl:pb-6 xl:px-8">
        <PageTransition>
          {children || <Outlet />}
        </PageTransition>
      </main>
    </div>
  )
}