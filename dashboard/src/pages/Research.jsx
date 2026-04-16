import { useState, useEffect } from 'react'
import api from '../api'
import { formatDateTime } from '../utils/date'

export default function Research() {
  const [items, setItems] = useState([])
  const [competitors, setCompetitors] = useState([])
  const [filter, setFilter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [expanded, setExpanded] = useState({})

  const fetchData = () => {
    setLoading(true)
    const params = filter ? `?competitor=${encodeURIComponent(filter)}` : ''
    Promise.all([
      api.get(`/research/items${params}`),
      api.get('/research/competitors'),
    ])
      .then(([it, comp]) => {
        setItems(it.data)
        setCompetitors(comp.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(fetchData, [filter])

  const runResearch = async () => {
    setRunning(true)
    try {
      await api.post('/agents/trigger/research')
      setTimeout(fetchData, 2000)
    } catch (e) {
      console.error(e)
    }
    setRunning(false)
  }

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const parseInsights = (content) => {
    if (!content) return []
    const obj = typeof content === 'string' ? JSON.parse(content) : content
    return obj?.insights || (Array.isArray(obj) ? obj : [])
  }

  const getFirstInsight = (content) => {
    try {
      const insights = parseInsights(content)
      if (insights.length > 0) {
        const text = insights[0].insight || ''
        return text.length > 200 ? text.slice(0, 200) + '...' : text
      }
    } catch {}
    return ''
  }

  return (
    <div className="space-y-14 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <header className="animate-fade-in-up">
          <p className="label-upper mb-3">Competitive Intelligence</p>
          <h1 className="text-[3rem] lg:text-[3.5rem] tracking-tight leading-none">Research</h1>
          <div className="warm-divider mt-5 max-w-[120px]" />
        </header>
        <button onClick={runResearch} disabled={running} className="btn-warm animate-fade-in-up delay-1">
          {running ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg>
              Running...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Run Research Agent
            </>
          )}
        </button>
      </div>

      {/* Competitor Filter */}
      <div className="flex flex-wrap gap-2.5 animate-fade-in-up delay-2">
        <button
          onClick={() => setFilter(null)}
          className={`chip ${!filter ? 'chip-active' : ''}`}
        >
          All
        </button>
        {competitors.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`chip ${filter === c ? 'chip-active' : ''}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Insight Cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-44" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<svg className="w-8 h-8 text-[#DDD7CE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          title="No Research Data"
          description="Run the research agent to generate competitor insights."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => {
            let insights = []
            try { insights = parseInsights(item.content) } catch {}
            const isExpanded = expanded[item.id]
            const snippet = getFirstInsight(item.content)

            return (
              <div
                key={item.id}
                className="slab overflow-hidden animate-fade-in-up"
                style={{
                  animationDelay: `${idx * 50}ms`,
                  borderLeft: `3px solid ${getCompetitorColor(item.competitor)}`,
                }}
              >
                <button onClick={() => toggle(item.id)} className="w-full text-left px-7 py-6 cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[17px] font-semibold text-[#2C2420]">{item.competitor}</h3>
                      <span className="text-[11px] font-semibold text-[#C8956C] bg-[#C8956C]/10 px-2.5 py-0.5 rounded-full">
                        {insights.length} insight{insights.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-[#8B8680] hidden sm:block">{formatDateTime(item.created_at)}</span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-[#2C2420] rotate-180' : 'bg-[#F2EDE6]'}`}>
                        <svg className={`w-3.5 h-3.5 transition-colors ${isExpanded ? 'text-white' : 'text-[#8B8680]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {!isExpanded && snippet && (
                    <p className="text-[14px] text-[#8B8680] leading-relaxed mt-2 line-clamp-2">{snippet}</p>
                  )}
                </button>

                {isExpanded && (
                  <div className="px-7 pb-7 space-y-5 border-t border-[#DDD7CE]">
                    {insights.map((ins, i) => (
                      <div key={i} className="pt-5">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#C8956C]/10 text-[#C8956C] flex items-center justify-center text-[11px] font-bold">{i + 1}</span>
                          {ins.platform && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-[#5F6360]/10 text-[#5F6360] text-[11px] font-semibold uppercase tracking-wide">
                              {ins.platform}
                            </span>
                          )}
                        </div>
                        <p className="text-[15px] text-[#2C2420] leading-relaxed">{ins.insight}</p>
                        {ins.actionable && (
                          <div className="mt-3 pl-4 border-l-2 border-[#C8956C]/25 py-1">
                            <p className="text-[11px] font-bold text-[#C8956C] uppercase tracking-[0.15em] mb-1">Recommended Action</p>
                            <p className="text-[13px] text-[#5F6360] leading-relaxed">{ins.actionable}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="slab p-16 text-center animate-fade-in-up border-dashed">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#F2EDE6] flex items-center justify-center">{icon}</div>
      <h3 className="text-xl text-[#2C2420] mb-2">{title}</h3>
      <p className="text-[14px] text-[#8B8680] max-w-sm mx-auto leading-relaxed">{description}</p>
    </div>
  )
}

const COMPETITOR_COLORS = {
  'CDK Stone': '#C8956C',
  'Metz Group': '#D4A76A',
  'Stone Alliance': '#A87B55',
  'National Tiles': '#5F6360',
  'Beaumont Tiles': '#8B8680',
}

function getCompetitorColor(name) {
  return COMPETITOR_COLORS[name] || '#C8956C'
}
