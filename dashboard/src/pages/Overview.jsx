import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { formatDateTime } from '../utils/date'

export default function Overview() {
  const [data, setData] = useState(null)
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/overview').then(r => r.data),
      api.get('/review/latest').then(r => r.data).catch(() => null),
    ])
      .then(([overview, latestReview]) => {
        setData(overview)
        setReview(latestReview)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton />

  const linkedin = data?.social_health?.find(s => s.platform === 'linkedin')

  return (
    <div className="space-y-14 animate-fade-in">
      {/* Header */}
      <header className="animate-fade-in-up">
        <p className="label-upper mb-3">Marketing Intelligence</p>
        <h1 className="text-[3rem] lg:text-[3.5rem] tracking-tight leading-none">Dashboard</h1>
        <div className="warm-divider mt-5 max-w-[120px]" />
      </header>

      {/* KPI slabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in-up delay-1">
        <KPI label="Published Posts" value={data?.published_posts ?? 0} sub="all-time" color="#C8956C" />
        <KPI label="Total Reach" value={formatNumber(data?.total_reach ?? 0)} sub="cumulative" color="#D4A76A" />
        <KPI label="Pending Ideas" value={data?.pending_ideas ?? 0} sub="awaiting review" color="#5F6360" />
        <KPI label="Website Changes" value={data?.website_changes ?? 0} sub="in queue" color="#8B8680" />
      </div>

      {/* Two-up: LinkedIn + Research */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LinkedIn */}
        <div
          className="lg:col-span-5 slab-dark p-8 cursor-pointer group animate-fade-in-up delay-2"
          onClick={() => navigate('/social-stats')}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
              <svg className="w-5 h-5" fill="#C8956C" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#F2EDE6]">LinkedIn</p>
              <p className="text-[11px] text-[#F2EDE6]/30">@{linkedin?.handle || 'petra-australia'}</p>
            </div>
            <svg className="w-4 h-4 text-[#F2EDE6]/15 ml-auto group-hover:text-[#C8956C] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>

          {linkedin ? (
            <>
              <p className="text-[11px] text-[#C8956C] uppercase tracking-[0.15em] font-bold mb-1">Followers</p>
              <p className="text-5xl font-bold text-[#F2EDE6] tracking-tight">{formatNumber(linkedin.followers)}</p>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
                <p className="text-[12px] text-[#F2EDE6]/25">Last scraped {formatDateTime(linkedin.scraped_at)}</p>
              </div>
            </>
          ) : (
            <p className="text-[14px] text-[#F2EDE6]/30">Run the Social Stats agent to start tracking.</p>
          )}
        </div>

        {/* Research Intelligence */}
        <div
          className="lg:col-span-7 slab p-8 cursor-pointer group animate-fade-in-up delay-3"
          onClick={() => navigate('/research')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4A76A]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#D4A76A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div>
                <h2 className="text-[18px] font-semibold">Research Intelligence</h2>
                <p className="text-[13px] text-[#8B8680] mt-0.5">Monitoring 5 competitors</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-[#8B8680] uppercase tracking-wider font-bold">Last run</p>
              <p className="text-[14px] font-medium text-[#2C2420] mt-0.5">
                {data?.last_research ? formatDateTime(data.last_research) : 'Never'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {['CDK Stone', 'Metz Group', 'Stone Alliance', 'National Tiles', 'Beaumont Tiles'].map(c => (
              <span key={c} className="px-4 py-2 rounded-full text-[13px] font-medium bg-[#F2EDE6] text-[#5F6360] border border-[#DDD7CE] group-hover:border-[#C8956C]/30 group-hover:text-[#C8956C] transition-colors">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Review Summary */}
      {review && (
        <div
          className="slab p-8 cursor-pointer group animate-fade-in-up delay-3"
          onClick={() => navigate('/review')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C8956C]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#C8956C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <h2 className="text-[18px] font-semibold">Daily Review</h2>
                <p className="text-[13px] text-[#8B8680] mt-0.5">
                  {review.review_date ? new Date(review.review_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Latest'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-[11px] text-[#8B8680] uppercase tracking-wider font-bold mb-1">Score</p>
                <p className={`text-3xl font-bold tracking-tight ${
                  review.score >= 60 ? 'text-emerald-600' : review.score >= 40 ? 'text-amber-500' : 'text-red-500'
                }`}>{review.score}</p>
              </div>
              <div className="text-center">
                <p className="text-[11px] text-[#8B8680] uppercase tracking-wider font-bold mb-1">Sentiment</p>
                <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-semibold capitalize ${
                  review.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  review.sentiment === 'negative' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>{review.sentiment}</span>
              </div>
              <svg className="w-4 h-4 text-[#8B8680]/30 ml-2 group-hover:text-[#C8956C] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>

          {/* Key Takeaways preview */}
          {review.sections?.key_takeaways?.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {review.sections.key_takeaways.slice(0, 3).map((t, i) => (
                <span key={i} className="px-4 py-2 rounded-full text-[13px] font-medium bg-[#F2EDE6] text-[#5F6360] border border-[#DDD7CE] group-hover:border-[#C8956C]/30 group-hover:text-[#C8956C] transition-colors truncate max-w-xs">
                  {typeof t === 'string' ? t : t.text || t.takeaway || JSON.stringify(t)}
                </span>
              ))}
              {review.sections.key_takeaways.length > 3 && (
                <span className="px-3 py-2 rounded-full text-[12px] font-medium text-[#8B8680]">
                  +{review.sections.key_takeaways.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Agent Schedule */}
      <div className="animate-fade-in-up delay-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-[#C8956C]" />
            <h2 className="text-[22px] font-semibold">Agent Schedule</h2>
          </div>
          <button
            onClick={() => navigate('/agents')}
            className="text-[13px] text-[#C8956C] font-semibold hover:text-[#A87B55] transition-colors flex items-center gap-1.5"
          >
            View all agents
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <TimeCard time="06:00" period="Daily" agent="Research" color="#C8956C" />
          <TimeCard time="07:00" period="Monday" agent="Strategy" color="#A87B55" />
          <TimeCard time="09:30" period="Daily" agent="Social Stats" color="#D4A76A" />
          <TimeCard time="12:00" period="Daily" agent="Website" color="#8B8680" />
          <TimeCard time="20:00" period="Daily" agent="Analytics" color="#5F6360" />
          <TimeCard time="21:00" period="Daily" agent="Review" color="#C8956C" />
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value, sub, color }) {
  return (
    <div className="slab p-6 group">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[11px] font-bold text-[#8B8680] uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="text-[2.75rem] font-bold tracking-tight leading-none" style={{ color }}>{value}</p>
      <p className="text-[12px] text-[#8B8680] mt-2 font-medium">{sub}</p>
    </div>
  )
}

function TimeCard({ time, period, agent, color }) {
  return (
    <div className="slab px-5 py-5 text-center group">
      <p className="text-[1.5rem] font-bold text-[#2C2420] tracking-tight">{time}</p>
      <p className="text-[10px] text-[#8B8680] uppercase tracking-[0.15em] font-bold mt-1">{period}</p>
      <div className="subtle-divider my-3" />
      <div className="flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[13px] font-semibold text-[#2C2420]">{agent}</p>
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-14">
      <div><div className="skeleton h-4 w-36 mb-3" /><div className="skeleton h-14 w-72" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-36" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5"><div className="lg:col-span-5 skeleton h-56" /><div className="lg:col-span-7 skeleton h-56" /></div>
      <div className="skeleton h-32" />
      <div className="grid grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
    </div>
  )
}

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
