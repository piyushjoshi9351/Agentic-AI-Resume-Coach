import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, useNavigate } from 'react-router-dom'
import { Briefcase, LayoutDashboard, Menu, MessageSquare, PanelLeftClose, PanelRightClose, ScanSearch, Sparkles, LogOut, Wrench, History as HistoryIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analyze', label: 'Analyze Resume', icon: ScanSearch },
  { to: '/results', label: 'Results', icon: Sparkles },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/interview', label: 'AI Interview', icon: MessageSquare },
  { to: '/job-tracker', label: 'Job Tracker', icon: Briefcase },
  { to: '/tools', label: 'Tools', icon: Wrench },
]

const navBase = 'group relative overflow-hidden flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300'

const navListVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
}

const navItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function Sidebar({ collapsed, onToggleCollapse }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const initials = useMemo(() => {
    const name = user?.name || 'U'
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }, [user?.name])

  const handleLogout = () => {
    logout()
    navigate('/auth', { replace: true })
  }

  const renderNavItems = (mobile = false) => (
    <motion.div variants={navListVariants} initial="hidden" animate="show" className={mobile ? 'contents' : 'space-y-2'}>
      {navigationItems.map((item) => {
        const Icon = item.icon
        return (
          <motion.div key={item.to} variants={navItemVariants} whileHover={{ x: mobile ? 0 : 3 }} whileTap={{ scale: 0.98 }}>
            <NavLink
              to={item.to}
              onClick={() => mobile && setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `${navBase} ${
                  isActive
                    ? 'border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white shadow-[0_0_24px_rgba(168,85,247,0.18)]'
                    : 'border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
                } ${mobile ? 'flex-col justify-center gap-1 px-2 py-2 text-[11px]' : collapsed ? 'justify-center xl:px-3' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-blue-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              <Icon className={`relative z-10 h-5 w-5 flex-shrink-0 transition-transform duration-300 ${mobile ? '' : 'group-hover:scale-110'}`} />
              {(!collapsed || mobile) && <span className="relative z-10 truncate">{item.label}</span>}
            </NavLink>
          </motion.div>
        )
      })}
    </motion.div>
  )

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className={`fixed left-0 top-0 z-40 hidden h-screen xl:flex xl:flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20">
              <span className="text-base font-bold text-white">AI</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Resume Coach</p>
                <h1 className="truncate text-base font-bold text-white">Workspace</h1>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
            {renderNavItems(false)}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-all duration-300 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/20">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user?.name || 'User avatar'} className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <span className="text-sm font-bold">{initials}</span>
              )}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user?.name || 'Signed in user'}</p>
                <p className="truncate text-xs text-slate-400">{user?.email || 'Active session'}</p>
              </div>
            )}

            {!collapsed && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.aside>

      <button
        type="button"
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        className="fixed bottom-24 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-950/90 text-white shadow-xl shadow-black/30 backdrop-blur-xl xl:hidden"
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl xl:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-3 gap-3 border-b border-white/10 px-4 py-3">
          <div className="col-span-2 flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name || 'Signed in user'}</p>
              <p className="truncate text-xs text-slate-400">{user?.email || 'Active session'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200"
          >
            Logout
          </button>
        </div>

        <nav className="grid grid-cols-3 gap-2 px-3 py-3 sm:grid-cols-6">
          {renderNavItems(true)}
        </nav>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-white/10 px-3 pb-3 pt-2"
            >
              <div className="grid grid-cols-2 gap-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `${navBase} justify-center ${isActive ? 'border border-purple-500/30 bg-purple-500/15 text-white' : 'border border-white/10 bg-white/5 text-slate-300'}`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}