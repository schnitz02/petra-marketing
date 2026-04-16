import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
    return bio.replace(/\\r\\n|\\n|\\r/g, ' ').replace(/\s{2,}/g, ' ').trim()
  }

  const firstFollowers = history.length > 1 ? history[0]?.followers : null
  const lastFollowers = current?.followers
  const followerGrowth = firstFollowers && lastFollowers ? lastFollowers - firstFollowers : null

  return (
    <div className="space-y-14 animate-fade-in">
      <header className="animate-fade-in-up">
        <p className="label-upper mb-3" style={{ color: '#0A66C2' }}>LinkedIn</p>
        <h1 className="text-[3rem] lg:text-[3.5rem] tracking-tight leading-none">Social Stats</h1>
        <div className="warm-divider mt-5 max-w-[120px]" />
      </header>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-7 skeleton h-48" />
            <div className="col-span-12 lg:col-span-5 skeleton h-48" />
          </div>
          <div className="skeleton h-80" />
        </div>
      ) : (
        <>
          {current ? (
            <>
              {/* Profile + Stats */}
              <div className="grid grid-cols-12 gap-5">
                {/* Profile card */}
                <div className="col-span-12 lg:col-span-7 slab-dark p-8 animate-fade-in-up delay-1">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#0A66C2]/20 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6" fill="#0A66C2" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-semibold text-[#F2EDE6]">Petra Industries</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0A66C2]/20 text-[#4A9FE8] text-[10px] font-bold uppercase tracking-wider">
                          {current.handle}
                        </span>
                      </div>
                      {current.bio && (
                        <p className="text-[14px] text-[#F2EDE6]/40 mt-3 leading-relaxed line-clamp-3">
                          {cleanBio(current.bio)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#F2EDE6]/25">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
                    <span>Last scraped {formatDate(current.scraped_at)}</span>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-4">
                  <StatCard label="Followers" value={current.followers?.toLocaleString('en-AU')} change={followerGrowth} accent="#0A66C2" />
                  <StatCard label="Employees" value={current.following?.toLocaleString('en-AU')} accent="#5F6360" />
                  <StatCard label="Posts" value={current.posts_count?.toLocaleString('en-AU') || '0'} accent="#D4A76A" />
                  <StatCard label="90d Growth" value={followerGrowth != null ? `+${followerGrowth}` : '--'} sub="followers" accent="#10B981" positive />
                </div>
              </div>

              {/* Follower Trend Chart */}
              {history.length > 1 && (
                <div className="slab p-8 animate-fade-in-up delay-3">
                  <div className="flex items-center justify-between mb-7">
                    <div>
                      <h3 className="text-xl font-semibold text-[#2C2420]">Follower Trend</h3>
                      <p className="text-[13px] text-[#8B8680] mt-1">90-day follower growth</p>
                    </div>
                    {followerGrowth != null && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        <span className="text-[13px] font-bold text-emerald-700">+{followerGrowth} followers</span>
                      </div>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={340}>
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="followerGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0A66C2" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#0A66C2" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DDD7CE" vertical={false} />
                      <XAxis
                        dataKey="scraped_at"
                        tick={{ fontSize: 11, fill: '#8B8680' }}
                        tickFormatter={v => formatDateShort(v)}
                        axisLine={{ stroke: '#DDD7CE' }}
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#8B8680' }} axisLine={false} tickLine={false} width={45} />
                      <Tooltip
                        contentStyle={{
                          background: '#2C2420', border: 'none', borderRadius: 12,
                          color: '#F2EDE6', fontSize: 13, padding: '12px 18px',
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
                        activeDot={{ r: 5, fill: '#0A66C2', stroke: '#FDFBF7', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <EmptyState />
          )}

          {/* Recent Posts */}
          {posts.length > 0 && (
            <div className="animate-fade-in-up delay-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 rounded-full bg-[#C8956C]" />
                <h3 className="text-[22px] font-semibold">Recent Posts</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {posts.map(p => (
                  <div key={p.post_id} className="slab overflow-hidden group">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt="" className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                    ) : (
                      <div className="w-full aspect-square bg-[#F2EDE6] flex items-center justify-center">
                        <span className="text-[#8B8680] text-[12px]">No thumbnail</span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-3 text-[12px] text-[#8B8680]">
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
          <div className="animate-fade-in-up delay-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 rounded-full bg-[#D4A76A]" />
                <div>
                  <h3 className="text-[22px] font-semibold">AI Analysis</h3>
                  <p className="text-[13px] text-[#8B8680] mt-0.5">Claude-powered social intelligence</p>
                </div>
              </div>
              <button onClick={runAnalysis} disabled={analyzing} className="btn-warm">
                {analyzing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg>
                    Analysing...
                  </>
                ) : 'Generate Analysis'}
              </button>
            </div>
            {analysis?.analysis ? (
              <div className="slab p-8 space-y-6">
                {analysis.analysis.summary && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#C8956C] mb-2">Summary</p>
                    <p className="text-[15px] text-[#2C2420] leading-relaxed">{analysis.analysis.summary}</p>
                  </div>
                )}
                {analysis.analysis.benchmarks && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#D4A76A] mb-2">Benchmarks</p>
                    <p className="text-[15px] text-[#2C2420] leading-relaxed">{analysis.analysis.benchmarks}</p>
                  </div>
                )}
                {analysis.analysis.recommendations && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#5F6360] mb-3">Recommendations</p>
                    <ul className="space-y-3">
                      {(Array.isArray(analysis.analysis.recommendations) ? analysis.analysis.recommendations : []).map((r, i) => (
                        <li key={i} className="flex items-start gap-3 text-[14px] text-[#2C2420]">
                          <span className="w-6 h-6 rounded-full bg-[#C8956C]/10 text-[#C8956C] flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                          <span className="leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[11px] text-[#8B8680] pt-2">Generated {formatDate(analysis.generated_at)}</p>
              </div>
            ) : (
              <div className="slab border-dashed p-14 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#C8956C]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#C8956C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <p className="text-[14px] text-[#8B8680]">Click "Generate Analysis" for AI-powered insights on your LinkedIn performance.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, change, sub, accent }) {
  return (
    <div className="slab p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />
        {change != null && change > 0 && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+{change}</span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: accent }}>{value}</p>
      <p className="text-[12px] text-[#8B8680] mt-1 font-medium">{sub || label}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="slab border-dashed p-16 text-center animate-fade-in-up">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#F2EDE6] flex items-center justify-center">
        <svg className="w-8 h-8 text-[#DDD7CE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 className="text-xl text-[#2C2420] mb-2">No Data Yet</h3>
      <p className="text-[14px] text-[#8B8680] max-w-md mx-auto leading-relaxed">
        Run the Social Stats agent to start tracking LinkedIn metrics.
      </p>
    </div>
  )
}
