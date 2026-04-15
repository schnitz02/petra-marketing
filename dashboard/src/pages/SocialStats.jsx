import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import api from '../api'
import { formatDate, formatDateShort } from '../utils/date'

export default function SocialStats() {
  const [latest, setLatest] = useState({})
  const [history, setHistory] = useState([])
  const [posts, setPosts] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/social-stats/latest'),
      api.get('/social-stats/history/linkedin'),
      api.get('/social-stats/posts/linkedin'),
      api.get('/social-stats/analysis/linkedin'),
    ])
      .then(([lat, hist, pst, anal]) => {
        setLatest(lat.data)
        setHistory(hist.data)
        setPosts(pst.data)
        setAnalysis(anal.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const r = await api.post('/social-stats/analysis/linkedin')
      setAnalysis(r.data)
    } catch (e) {
      console.error(e)
    }
    setAnalyzing(false)
  }

  const current = latest.linkedin

  const cleanBio = (bio) => {
    if (!bio) return ''
    return bio
      .replace(/\\r\\n|\\n|\\r/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  const firstFollowers = history.length > 1 ? history[0]?.followers : null
  const lastFollowers = current?.followers
  const followerGrowth = firstFollowers && lastFollowers ? lastFollowers - firstFollowers : null

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="animate-fade-in-up">
        <p className="text-xs font-semibold text-[#0A66C2] uppercase tracking-[0.2em] mb-2">LinkedIn</p>
        <h1 className="text-3xl lg:text-4xl text-[#1A1A1A] tracking-tight leading-tight font-bold">
          Social Stats
        </h1>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-8 h-52 bg-[#E0DFDD] rounded-2xl" />
            <div className="col-span-4 h-52 bg-[#E0DFDD] rounded-2xl" />
          </div>
          <div className="h-80 bg-[#E0DFDD] rounded-2xl" />
        </div>
      ) : (
        <>
          {current ? (
            <>
              {/* Profile + Stats row */}
              <div className="grid grid-cols-12 gap-5 animate-fade-in-up delay-1">
                {/* Profile card */}
                <div className="col-span-12 lg:col-span-7 bg-white border border-[#E0DFDD] rounded-2xl p-7 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6" fill="#0A66C2" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-[#1A1A1A]">Petra Industries</h2>
                        <span className="px-2 py-0.5 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] text-[10px] font-semibold uppercase tracking-wider">
                          {current.handle}
                        </span>
                      </div>
                      {current.bio && (
                        <p className="text-sm text-[#8B8680] mt-2 leading-relaxed line-clamp-3">
                          {cleanBio(current.bio)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#8B8680]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Last scraped {formatDate(current.scraped_at)}</span>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-4">
                  <StatCard
                    label="Followers"
                    value={current.followers?.toLocaleString('en-AU')}
                    change={followerGrowth}
                    icon={<FollowersIcon />}
                  />
                  <StatCard
                    label="Employees"
                    value={current.following?.toLocaleString('en-AU')}
                    icon={<EmployeesIcon />}
                  />
                  <StatCard
                    label="Posts"
                    value={current.posts_count?.toLocaleString('en-AU') || '0'}
                    icon={<PostsIcon />}
                  />
                  <StatCard
                    label="90d Growth"
                    value={followerGrowth != null ? `+${followerGrowth}` : '--'}
                    sub="followers"
                    icon={<GrowthIcon />}
                    positive
                  />
                </div>
              </div>

              {/* Follower Trend Chart */}
              {history.length > 1 && (
                <div className="bg-white border border-[#E0DFDD] rounded-2xl p-7 shadow-sm animate-fade-in-up delay-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-semibold text-[#1A1A1A]">Follower Trend</h3>
                      <p className="text-xs text-[#8B8680] mt-0.5">90-day follower growth</p>
                    </div>
                    {followerGrowth != null && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        <span className="text-xs font-semibold text-emerald-700">+{followerGrowth} followers</span>
                      </div>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="followerGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0A66C2" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#0A66C2" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0DFDD" vertical={false} />
                      <XAxis
                        dataKey="scraped_at"
                        tick={{ fontSize: 11, fill: '#8B8680' }}
                        tickFormatter={v => formatDateShort(v)}
                        axisLine={{ stroke: '#E0DFDD' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#8B8680' }}
                        axisLine={false}
                        tickLine={false}
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1A1A1A', border: 'none', borderRadius: 10,
                          color: '#fff', fontSize: 12, padding: '10px 16px',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                        }}
                        labelFormatter={v => formatDate(v)}
                        formatter={(value) => [value.toLocaleString('en-AU'), 'Followers']}
                      />
                      <Area
                        type="monotone"
                        dataKey="followers"
                        stroke="#0A66C2"
                        strokeWidth={2.5}
                        fill="url(#followerGradient)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#0A66C2', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-dashed border-[#E0DFDD] rounded-2xl p-16 text-center animate-fade-in-up">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F5F5F3] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#E0DFDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg text-[#1A1A1A] mb-1">No Data Yet</h3>
              <p className="text-sm text-[#8B8680] max-w-md mx-auto">
                Run the Social Stats agent to start tracking LinkedIn metrics.
              </p>
            </div>
          )}

          {/* Recent Posts Grid */}
          {posts.length > 0 && (
            <div className="animate-fade-in-up delay-3">
              <h3 className="text-base font-semibold text-[#1A1A1A] mb-5">Recent Posts</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {posts.map(p => (
                  <div key={p.post_id} className="bg-white border border-[#E0DFDD] rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt="" className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square bg-[#F5F5F3] flex items-center justify-center">
                        <span className="text-[#8B8680] text-xs">No thumbnail</span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-3 text-xs text-[#8B8680]">
                        <span>{p.likes} likes</span>
                        <span>{p.comments} comments</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div className="animate-fade-in-up delay-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-[#1A1A1A]">AI Analysis</h3>
                <p className="text-xs text-[#8B8680] mt-0.5">Claude-powered social intelligence</p>
              </div>
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="px-5 py-2.5 rounded-xl bg-[#C8956C] text-white text-sm font-medium
                  hover:bg-[#b8854f] transition-colors disabled:opacity-50 shadow-sm
                  flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg>
                    Analysing...
                  </>
                ) : 'Generate Analysis'}
              </button>
            </div>
            {analysis?.analysis ? (
              <div className="bg-white border border-[#E0DFDD] rounded-2xl p-8 shadow-sm space-y-6">
                {analysis.analysis.summary && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C8956C] mb-2">Summary</p>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{analysis.analysis.summary}</p>
                  </div>
                )}
                {analysis.analysis.benchmarks && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#D4A76A] mb-2">Benchmarks</p>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{analysis.analysis.benchmarks}</p>
                  </div>
                )}
                {analysis.analysis.recommendations && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6360] mb-3">Recommendations</p>
                    <ul className="space-y-3">
                      {(Array.isArray(analysis.analysis.recommendations) ? analysis.analysis.recommendations : []).map((r, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-[#1A1A1A]">
                          <span className="w-6 h-6 rounded-full bg-[#C8956C]/10 text-[#C8956C] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                          <span className="leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[11px] text-[#8B8680] pt-2">Generated {formatDate(analysis.generated_at)}</p>
              </div>
            ) : (
              <div className="bg-white border border-dashed border-[#E0DFDD] rounded-2xl p-14 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#C8956C]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#C8956C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <p className="text-sm text-[#8B8680]">Click "Generate Analysis" for AI-powered insights on your LinkedIn performance.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, change, sub, icon, positive }) {
  return (
    <div className="bg-white border border-[#E0DFDD] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#F5F5F3] flex items-center justify-center text-[#8B8680]">
          {icon}
        </div>
        {change != null && change > 0 && (
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">+{change}</span>
        )}
      </div>
      <p className="text-xl font-bold text-[#1A1A1A] tracking-tight">{value}</p>
      <p className="text-[11px] text-[#8B8680] mt-0.5">{sub || label}</p>
    </div>
  )
}

function FollowersIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}

function EmployeesIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
}

function PostsIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
}

function GrowthIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
}
