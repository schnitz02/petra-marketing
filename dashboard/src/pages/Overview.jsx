import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { formatDateTime } from '../utils/date'

export default function Overview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard/overview')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton />

  const linkedin = data?.social_health?.find(s => s.platform === 'linkedin')

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page header */}
      <div className="animate-fade-in-up">
        <p className="text-xs font-semibold text-[#C8956C] uppercase tracking-[0.2em] mb-2">Marketing Intelligence</p>
        <h1 className="text-3xl lg:text-4xl text-[#1A1A1A] tracking-tight leading-tight font-bold">
          Dashboard
        </h1>
      </div>

      {/* Top row: KPIs + LinkedIn summary */}
      <div className="grid grid-cols-12 gap-5 animate-fade-in-up delay-1">
        {/* KPI Cards */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-5">
          <KPICard
            label="Published Posts"
            value={data?.published_posts ?? 0}
            sub="all-time"
            icon={<PostsIcon />}
            accent="#C8956C"
          />
          <KPICard
            label="Total Reach"
            value={formatNumber(data?.total_reach ?? 0)}
            sub="cumulative"
            icon={<ReachIcon />}
            accent="#D4A76A"
          />
          <KPICard
            label="Pending Ideas"
            value={data?.pending_ideas ?? 0}
            sub="awaiting review"
            icon={<IdeasIcon />}
            accent="#5F6360"
          />
          <KPICard
            label="Website Changes"
            value={data?.website_changes ?? 0}
            sub="in queue"
            icon={<WebIcon />}
            accent="#8B8680"
          />
        </div>

        {/* LinkedIn summary card */}
        <div className="col-span-12 lg:col-span-4">
          <div
            className="bg-white border border-[#E0DFDD] rounded-2xl p-6 shadow-sm h-full flex flex-col justify-between
              hover:shadow-md hover:border-[#0A66C2]/20 transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/social-stats')}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center">
                    <LinkedInIcon color="#0A66C2" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">LinkedIn</p>
                    <p className="text-[11px] text-[#8B8680]">@{linkedin?.handle || 'petra-australia'}</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-[#E0DFDD] group-hover:text-[#0A66C2] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {linkedin ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#8B8680] uppercase tracking-wider font-medium">Followers</p>
                    <p className="text-4xl font-bold text-[#1A1A1A] tracking-tight mt-1">{formatNumber(linkedin.followers)}</p>
                  </div>
                  <div className="h-px bg-[#E0DFDD]" />
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-sm text-[#8B8680]">
                      Last scraped {formatDateTime(linkedin.scraped_at)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#8B8680]">Run the Social Stats agent to start tracking.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Research Intelligence */}
      <div className="animate-fade-in-up delay-3">
        <div
          className="bg-white border border-[#E0DFDD] rounded-2xl shadow-sm overflow-hidden
            hover:shadow-md transition-shadow duration-300 cursor-pointer"
          onClick={() => navigate('/research')}
        >
          <div className="px-7 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#D4A76A]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#D4A76A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1A1A1A]">Research Intelligence</h2>
                <p className="text-sm text-[#8B8680] mt-0.5">
                  Monitoring 5 competitors
                </p>
              </div>
            </div>
            <div className="text-right flex items-center gap-6">
              <div>
                <p className="text-xs text-[#8B8680] uppercase tracking-wider font-medium">Last run</p>
                <p className="text-base font-medium text-[#1A1A1A] mt-0.5">
                  {data?.last_research ? formatDateTime(data.last_research) : 'Never'}
                </p>
              </div>
              <svg className="w-4 h-4 text-[#E0DFDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div className="px-7 pb-5 flex flex-wrap gap-2">
            {['CDK Stone', 'Metz Group', 'Stone Alliance', 'National Tiles', 'Beaumont Tiles'].map(c => (
              <span key={c} className="px-3.5 py-1.5 rounded-full bg-[#F5F5F3] text-xs font-medium text-[#5F6360] border border-[#E0DFDD]">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Schedule */}
      <div className="animate-fade-in-up delay-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#5F6360]" />
            <h2 className="text-base font-semibold text-[#1A1A1A]">Agent Schedule</h2>
          </div>
          <button
            onClick={() => navigate('/agents')}
            className="text-sm text-[#C8956C] font-medium hover:text-[#b8854f] transition-colors"
          >
            View all agents
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <ScheduleCard time="06:00" period="Daily" agent="Research" color="#C8956C" />
          <ScheduleCard time="07:00" period="Monday" agent="Strategy" color="#B07D4F" />
          <ScheduleCard time="09:30" period="Daily" agent="Social Stats" color="#D4A76A" />
          <ScheduleCard time="12:00" period="Daily" agent="Website" color="#8B8680" />
          <ScheduleCard time="20:00" period="Daily" agent="Analytics" color="#5F6360" />
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, sub, icon, accent }) {
  return (
    <div className="bg-white border border-[#E0DFDD] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: accent + '12' }}>
          <div style={{ color: accent }}>{icon}</div>
        </div>
        <p className="text-xs font-semibold text-[#8B8680] uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-4xl font-bold text-[#1A1A1A] tracking-tight">{value}</p>
      <p className="text-xs text-[#8B8680] mt-2">{sub}</p>
    </div>
  )
}

function ScheduleCard({ time, period, agent, color }) {
  return (
    <div className="bg-white border border-[#E0DFDD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="text-center">
        <p className="text-xl font-bold text-[#1A1A1A] tracking-tight">{time}</p>
        <p className="text-[11px] text-[#8B8680] uppercase tracking-wider mt-1">{period}</p>
        <div className="mt-3 pt-3 border-t border-[#E0DFDD]">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <p className="text-sm font-medium text-[#1A1A1A]">{agent}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div>
        <div className="h-4 w-32 bg-[#E0DFDD] rounded mb-3" />
        <div className="h-10 w-56 bg-[#E0DFDD] rounded-lg" />
      </div>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-[#E0DFDD] rounded-2xl" />)}
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="h-full min-h-[280px] bg-[#E0DFDD] rounded-2xl" />
        </div>
      </div>
      <div className="h-24 bg-[#E0DFDD] rounded-2xl" />
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-[#E0DFDD] rounded-2xl" />)}
      </div>
    </div>
  )
}

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function LinkedInIcon({ color }) {
  return <svg className="w-4.5 h-4.5" fill={color} viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
}

function PostsIcon() {
  return <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
}

function ReachIcon() {
  return <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}

function IdeasIcon() {
  return <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
}

function WebIcon() {
  return <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
}
