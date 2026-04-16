import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Overview from './pages/Overview'
import SocialStats from './pages/SocialStats'
import Research from './pages/Research'
import Analytics from './pages/Analytics'
import Agents from './pages/Agents'
import Calendar from './pages/Calendar'
import Strategy from './pages/Strategy'
import Website from './pages/Website'
import Review from './pages/Review'

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: OverviewIcon },
  { path: '/review', label: 'Review', icon: ReviewIcon },
  { path: '/social-stats', label: 'Social Stats', icon: SocialIcon },
  { path: '/research', label: 'Research', icon: ResearchIcon },
  { path: '/strategy', label: 'Strategy', icon: StrategyIcon },
  { path: '/website', label: 'Website', icon: WebsiteIcon },
  { path: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
  { path: '/agents', label: 'Agents', icon: AgentsIcon },
  { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
]

export default function App() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[280px]'

  return (
    <div className="flex min-h-screen bg-[#F7F3EE]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen ${sidebarWidth}
        bg-gradient-to-b from-[#2C2420] to-[#1A1714] flex flex-col
        transition-all duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Collapse toggle — top of sidebar */}
        <div className={`hidden lg:flex ${collapsed ? 'justify-center px-2' : 'justify-end px-5'} pt-2 pb-0`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/30 hover:text-[#C8956C] hover:bg-white/5 transition-all"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Logo block */}
        <div className={`border-b border-white/[0.06] ${collapsed ? 'px-3 pt-2 pb-5' : 'px-6 pt-0 pb-4'}`}>
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="Petra Industries"
              className={`invert brightness-200 transition-all duration-300 ${collapsed ? 'h-8 w-auto' : 'w-[65%] h-auto'}`}
            />
          </div>
          {!collapsed && (
            <>
              <p className="text-[11px] text-[#C8956C] tracking-[0.2em] uppercase mt-3 font-medium text-center">
                Precision in Every Surface
              </p>
              <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#C8956C]/30 to-transparent" />
            </>
          )}
          {collapsed && (
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[#C8956C]/30 to-transparent" />
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-2 py-4' : 'px-4 py-5'} space-y-1 overflow-y-auto`}>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => setSidebarOpen(false)}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `
                group flex items-center ${collapsed ? 'justify-center px-0 py-3' : 'gap-3.5 px-4 py-3'} rounded-lg
                text-sm font-medium tracking-wide transition-all duration-200
                ${isActive
                  ? 'bg-[#C8956C] text-white shadow-lg shadow-[#C8956C]/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              <Icon active={location.pathname === path || (path !== '/' && location.pathname.startsWith(path))} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className={`${collapsed ? 'px-2 py-4' : 'px-5 py-5'} border-t border-white/[0.06]`}>
          <a
            href="https://au.linkedin.com/company/petra-australia"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-4'} py-2.5 rounded-lg text-white/40 hover:text-[#C8956C] hover:bg-white/5 transition-all text-xs`}
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            {!collapsed && <span className="tracking-wide">LinkedIn</span>}
          </a>
          {!collapsed && (
            <div className="mt-3 px-4 text-[10px] text-white/20 tracking-wide">
              Marketing Intelligence
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#F7F3EE]/80 backdrop-blur-md border-b border-[#DDD7CE] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[#E0DFDD] transition-colors"
          >
            <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src="/logo.png" alt="Petra" className="h-7 w-auto" />
        </header>

        <main className="p-6 lg:px-16 lg:py-14 max-w-[1400px]">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/review" element={<Review />} />
            <Route path="/social-stats" element={<SocialStats />} />
            <Route path="/research" element={<Research />} />
            <Route path="/strategy" element={<Strategy />} />
            <Route path="/website" element={<Website />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/calendar" element={<Calendar />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

/* ─── Nav Icons ────────────────────────────────────────────────── */

function ReviewIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function OverviewIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  )
}

function SocialIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function ResearchIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function AnalyticsIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function AgentsIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function CalendarIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function StrategyIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

function WebsiteIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  )
}
