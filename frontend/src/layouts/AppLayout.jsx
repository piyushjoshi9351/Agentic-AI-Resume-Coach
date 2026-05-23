import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100"
      style={{ '--sidebar-width': collapsed ? '5.5rem' : '18rem' }}
    >
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((prev) => !prev)} />

      <main className="min-h-screen px-4 py-6 pb-28 transition-all duration-300 xl:pl-[var(--sidebar-width)] xl:pb-6 xl:px-8">
        {children || <Outlet />}
      </main>
    </div>
  )
}