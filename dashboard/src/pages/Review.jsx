import { useState, useEffect } from 'react'
import api from '../api'
import { formatDate, formatDateTime } from '../utils/date'

export default function Review() {
  const [review, setReview] = useState(null)
  const [history, setHistory] = useState([])
  const [historyIdx, setHistoryIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [creatingIdea, setCreatingIdea] = useState({})
  const [createdIdeas, setCreatedIdeas] = useState({})

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/review/latest'),
      api.get('/review/history'),
    ])
      .then(([latestRes, historyRes]) => {
        const hist = historyRes.data || []
        setHistory(hist)
        if (latestRes.data) {
          setReview(latestRes.data)
          setHistoryIdx(0)
        } else {
          setReview(null)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const navigateReview = (direction) => {
    const newIdx = historyIdx + direction
    if (newIdx < 0 || newIdx >= history.length) return
    setHistoryIdx(newIdx)
    setLoading(true)
    api.get(`/review/${history[newIdx].id}`)
      .then(r => setReview(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const createIdea = async (action, context, actionIdx) => {
    setCreatingIdea(prev => ({ ...prev, [actionIdx]: true }))
    try {
      await api.post('/review/create-idea', { action, context })
      setCreatedIdeas(prev => ({ ...prev, [actionIdx]: true }))
      setTimeout(() => {
        setCreatedIdeas(prev => ({ ...prev, [actionIdx]: false }))
      }, 2500)
    } catch (e) {
      console.error(e)
    }
    setCreatingIdea(prev => ({ ...prev, [actionIdx]: false }))
  }

  if (loading) return <PageSkeleton />

  if (!review) return <EmptyState />

  const sections = typeof review.sections === 'string'
    ? JSON.parse(review.sections)
    : review.sections

  const perf = sections?.petra_performance
  const competitors = sections?.competitor_activity
  const takeaways = sections?.key_takeaways
  const actions = sections?.recommended_actions

  const scoreColor = review.score >= 60
    ? '#10B981'
    : review.score >= 40
      ? '#F59E0B'
      : '#EF4444'

  const sentimentColors = {
    positive: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    neutral: { bg: '#FFF7ED', text: '#D97706', border: '#FDE68A' },
    negative: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  }
  const sentimentStyle = sentimentColors[review.sentiment] || sentimentColors.neutral

  return (
    <div className="space-y-20 animate-fade-in">
      {/* Header */}
      <header className="animate-fade-in-up">
        <p className="label-upper mb-4">Daily Review</p>
        <h1 className="text-[3rem] lg:text-[3.5rem] tracking-tight leading-none">Review</h1>
        <div className="warm-divider mt-6 max-w-[120px]" />
      </header>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-6 animate-fade-in-up delay-1">
        <button
          onClick={() => navigateReview(1)}
          disabled={historyIdx >= history.length - 1}
          className="w-11 h-11 rounded-xl border border-[#DDD7CE] bg-[#FDFBF7] flex items-center justify-center hover:border-[#C8956C] hover:text-[#C8956C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center min-w-[200px]">
          <p className="text-[22px] font-semibold text-[#2C2420] tracking-tight">
            {formatDate(review.review_date)}
          </p>
          {history.length > 0 && (
            <p className="text-[12px] text-[#8B8680] mt-1">
              {historyIdx + 1} of {history.length} reviews
            </p>
          )}
        </div>
        <button
          onClick={() => navigateReview(-1)}
          disabled={historyIdx <= 0}
          className="w-11 h-11 rounded-xl border border-[#DDD7CE] bg-[#FDFBF7] flex items-center justify-center hover:border-[#C8956C] hover:text-[#C8956C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Score Card */}
      <div className="slab p-10 lg:p-12 animate-fade-in-up delay-2">
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
          <div className="flex flex-col items-center min-w-[80px]">
            <p className="text-[11px] font-bold text-[#8B8680] uppercase tracking-[0.15em] mb-3">Score</p>
            <p className="text-6xl font-bold tracking-tight" style={{ color: scoreColor }}>
              {review.score}
            </p>
            <p className="text-[12px] font-semibold mt-2" style={{ color: scoreColor }}>
              {review.score >= 80 ? 'Excellent' : review.score >= 60 ? 'Good' : review.score >= 40 ? 'Fair' : review.score >= 20 ? 'Poor' : 'Critical'}
            </p>
          </div>
          <div className="w-px h-24 bg-[#DDD7CE] hidden sm:block" />
          <div className="flex flex-col items-center sm:items-start gap-4 flex-1">
            <div className="flex items-center gap-4">
              <span
                className="px-5 py-2 rounded-full text-[13px] font-semibold border"
                style={{
                  backgroundColor: sentimentStyle.bg,
                  color: sentimentStyle.text,
                  borderColor: sentimentStyle.border,
                }}
              >
                {review.sentiment ? review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1) : 'N/A'}
              </span>
              <p className="text-[12px] text-[#8B8680]">
                Generated {formatDateTime(review.created_at)}
              </p>
            </div>
            {sections?.score_reasoning && (
              <p className="text-[15px] text-[#5F6360] leading-[1.7] mt-1">
                {sections.score_reasoning}
              </p>
            )}
          </div>
        </div>

        {/* Score legend */}
        <div className="mt-8 pt-7 border-t border-[#DDD7CE]">
          <div className="flex items-center gap-6 flex-wrap">
            <p className="text-[10px] font-bold text-[#8B8680] uppercase tracking-[0.15em]">Scale</p>
            {[
              { min: 80, label: 'Excellent', color: '#10B981' },
              { min: 60, label: 'Good', color: '#10B981' },
              { min: 40, label: 'Fair', color: '#F59E0B' },
              { min: 20, label: 'Poor', color: '#EF4444' },
              { min: 0, label: 'Critical', color: '#EF4444' },
            ].map(({ min, label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity: review.score >= min && review.score < (min + 20 > 100 ? 101 : min + 20) ? 1 : 0.25 }} />
                <span className="text-[11px] text-[#8B8680]" style={{ fontWeight: review.score >= min && review.score < (min + 20 > 100 ? 101 : min + 20) ? 700 : 400 }}>
                  {min}–{min + 19 > 99 ? '100' : min + 19} {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Petra Performance */}
      {perf && (
        <div className="animate-fade-in-up delay-3">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-1 h-7 rounded-full bg-[#C8956C]" />
            <h2 className="text-[22px] font-semibold">{perf.title}</h2>
          </div>
          <div className="slab p-10 space-y-8">
            <p className="text-[15px] text-[#2C2420] leading-[1.7]">{perf.summary}</p>

            {perf.metrics && (
              <div className="flex flex-wrap gap-4">
                <MetricPill
                  label="Follower Change"
                  value={perf.metrics.follower_change > 0
                    ? `+${perf.metrics.follower_change}`
                    : String(perf.metrics.follower_change)}
                  color={perf.metrics.follower_change >= 0 ? '#10B981' : '#EF4444'}
                />
                <MetricPill
                  label="New Posts"
                  value={String(perf.metrics.new_posts)}
                  color="#C8956C"
                />
                <MetricPill
                  label="Engagement"
                  value={String(perf.metrics.total_engagement)}
                  color="#D4A76A"
                />
              </div>
            )}

            {perf.highlights && perf.highlights.length > 0 && (
              <div className="space-y-4 pt-3">
                <p className="text-[11px] font-bold text-[#C8956C] uppercase tracking-[0.15em]">Highlights</p>
                <ul className="space-y-3.5">
                  {perf.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3.5 text-[14px] text-[#2C2420]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C8956C] mt-2 shrink-0" />
                      <span className="leading-[1.7]">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Competitor Activity */}
      {competitors && competitors.competitors && competitors.competitors.length > 0 && (
        <div className="animate-fade-in-up delay-4">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-1 h-7 rounded-full bg-[#D4A76A]" />
            <div>
              <h2 className="text-[22px] font-semibold">{competitors.title}</h2>
              {competitors.summary && (
                <p className="text-[13px] text-[#8B8680] mt-1">{competitors.summary}</p>
              )}
            </div>
          </div>
          <div className="space-y-5">
            {competitors.competitors.map((comp, i) => {
              const threatColors = {
                low: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
                medium: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
                high: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
              }
              const threat = threatColors[comp.threat_level] || threatColors.low

              const compScoreColor = comp.score >= 60 ? '#10B981' : comp.score >= 40 ? '#F59E0B' : '#EF4444'

              return (
                <div key={i} className="slab p-8" style={{ borderLeft: '3px solid #D4A76A' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-[17px] font-semibold text-[#2C2420]">{comp.name}</h3>
                      {comp.score != null && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold border"
                          style={{
                            color: compScoreColor,
                            borderColor: `${compScoreColor}30`,
                            backgroundColor: `${compScoreColor}08`,
                          }}
                        >
                          {comp.score}
                        </span>
                      )}
                    </div>
                    <span
                      className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border"
                      style={{
                        backgroundColor: threat.bg,
                        color: threat.text,
                        borderColor: threat.border,
                      }}
                    >
                      {comp.threat_level}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#5F6360] leading-[1.7]">{comp.activity}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      {takeaways && takeaways.items && takeaways.items.length > 0 && (
        <div className="animate-fade-in-up delay-5">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-1 h-7 rounded-full bg-[#5F6360]" />
            <h2 className="text-[22px] font-semibold">{takeaways.title}</h2>
          </div>
          <div className="slab p-10">
            <ul className="space-y-6">
              {takeaways.items.map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-[15px] text-[#2C2420]">
                  <span className="w-8 h-8 rounded-full bg-[#C8956C]/10 text-[#C8956C] flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-[1.7]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {actions && actions.items && actions.items.length > 0 && (
        <div className="animate-fade-in-up delay-6">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-1 h-7 rounded-full bg-[#C8956C]" />
            <h2 className="text-[22px] font-semibold">{actions.title}</h2>
          </div>
          <div className="space-y-5">
            {actions.items.map((item, i) => {
              const priorityColors = {
                high: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
                medium: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
                low: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
              }
              const priority = priorityColors[item.priority] || priorityColors.medium

              return (
                <div key={i} className="slab p-8">
                  <div className="flex items-start justify-between gap-5 mb-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h3 className="text-[16px] font-semibold text-[#2C2420]">{item.action}</h3>
                      <span
                        className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                        style={{
                          backgroundColor: priority.bg,
                          color: priority.text,
                          borderColor: priority.border,
                        }}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <button
                      onClick={() => createIdea(item.action, item.context, i)}
                      disabled={creatingIdea[i] || createdIdeas[i]}
                      className="shrink-0 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-70"
                      style={{
                        backgroundColor: createdIdeas[i] ? '#10B981' : '#C8956C',
                        color: '#FDFBF7',
                      }}
                    >
                      {creatingIdea[i] ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                          </svg>
                          Creating...
                        </span>
                      ) : createdIdeas[i] ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Created!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Create Idea
                        </span>
                      )}
                    </button>
                  </div>
                  {item.context && (
                    <p className="text-[14px] text-[#5F6360] leading-[1.7]">{item.context}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricPill({ label, value, color }) {
  return (
    <div
      className="px-6 py-4 rounded-2xl border flex items-center gap-4"
      style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
    >
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <div>
        <p className="text-[11px] font-bold text-[#8B8680] uppercase tracking-[0.1em] mb-0.5">{label}</p>
        <p className="text-[20px] font-bold tracking-tight" style={{ color }}>{value}</p>
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-20">
      <div>
        <div className="skeleton h-4 w-28 mb-4" />
        <div className="skeleton h-14 w-56" />
      </div>
      <div className="flex justify-center">
        <div className="skeleton h-11 w-72" />
      </div>
      <div className="skeleton h-48" />
      <div className="skeleton h-64" />
      <div className="space-y-5">
        {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-36" />)}
      </div>
      <div className="skeleton h-48" />
      <div className="space-y-5">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32" />)}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="space-y-20 animate-fade-in">
      <header className="animate-fade-in-up">
        <p className="label-upper mb-4">Daily Review</p>
        <h1 className="text-[3rem] lg:text-[3.5rem] tracking-tight leading-none">Review</h1>
        <div className="warm-divider mt-6 max-w-[120px]" />
      </header>
      <div className="slab-dark p-20 text-center animate-fade-in-up delay-1">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.06] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#C8956C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[#F2EDE6] mb-3">No Reviews Yet</h3>
        <p className="text-[14px] text-[#F2EDE6]/40 max-w-sm mx-auto leading-relaxed">
          Run the Review agent to generate your first daily performance review. Reviews are created automatically each day.
        </p>
      </div>
    </div>
  )
}
