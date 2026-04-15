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
        return text.length > 180 ? text.slice(0, 180) + '...' : text
      }
    } catch {}
    return ''
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold text-[#C8956C] uppercase tracking-[0.2em] mb-2">Competitive Intelligence</p>
          <h1 className="text-3xl lg:text-4xl text-[#1A1A1A] tracking-tight leading-tight font-bold">Research</h1>
        </div>
        <button
          onClick={runResearch}
          disabled={running}
          className="px-6 py-3 rounded-xl bg-[#C8956C] text-white text-sm font-semibold
            hover:bg-[#b8854f] transition-colors disabled:opacity-50 shadow-sm
            flex items-center gap-2.5"
        >
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
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setFilter(null)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            !filter
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-white border border-[#E0DFDD] text-[#8B8680] hover:border-[#C8956C] hover:text-[#C8956C]'
          }`}
        >
          All
        </button>
        {competitors.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              filter === c
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white border border-[#E0DFDD] text-[#8B8680] hover:border-[#C8956C] hover:text-[#C8956C]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Insight Cards */}
      {loading ? (
        <div className="space-y-5 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-[#E0DFDD] rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E0DFDD] rounded-2xl p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F5F5F3] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#E0DFDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">No Research Data</h3>
          <p className="text-[#8B8680]">Run the research agent to generate competitor insights.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((item, idx) => {
            let insights = []
            try { insights = parseInsights(item.content) } catch {}
            const isExpanded = expanded[item.id]
            const snippet = getFirstInsight(item.content)

            return (
              <div
                key={item.id}
                className="bg-white border border-[#E0DFDD] rounded-2xl shadow-sm overflow-hidden
                  hover:shadow-md transition-shadow animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Always-visible header with snippet */}
                <button
                  onClick={() => toggle(item.id)}
                  className="w-full text-left px-8 py-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#C8956C]/10 flex items-center justify-center">
                        <svg className="w-4.5 h-4.5 text-[#C8956C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <span className="text-base font-semibold text-[#1A1A1A]">
                        {item.competitor}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[#8B8680]">{formatDateTime(item.created_at)}</span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-[#1A1A1A]' : 'bg-[#F5F5F3]'}`}>
                        <svg
                          className={`w-4 h-4 transition-all duration-200 ${isExpanded ? 'rotate-180 text-white' : 'text-[#8B8680]'}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Snippet preview — always visible when collapsed */}
                  {!isExpanded && snippet && (
                    <div className="mt-2 ml-12">
                      <p className="text-sm text-[#8B8680] leading-relaxed">{snippet}</p>
                      <p className="text-xs text-[#C8956C] font-medium mt-2">
                        {insights.length} insight{insights.length !== 1 ? 's' : ''} — click to expand
                      </p>
                    </div>
                  )}
                </button>

                {/* Expanded insights */}
                {isExpanded && (
                  <div className="px-8 pb-8 space-y-6 border-t border-[#E0DFDD]">
                    {insights.map((ins, i) => (
                      <div key={i} className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="w-7 h-7 rounded-full bg-[#C8956C]/10 text-[#C8956C] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          {ins.platform && (
                            <span className="px-2.5 py-1 rounded-lg bg-[#5F6360]/10 text-[#5F6360] text-xs font-medium uppercase tracking-wide">
                              {ins.platform}
                            </span>
                          )}
                        </div>
                        <p className="text-[15px] text-[#1A1A1A] leading-relaxed">{ins.insight}</p>
                        {ins.actionable && (
                          <div className="mt-4 pl-5 border-l-2 border-[#C8956C]/30 py-1">
                            <p className="text-xs font-semibold text-[#C8956C] uppercase tracking-wider mb-1.5">Recommended Action</p>
                            <p className="text-sm text-[#5F6360] leading-relaxed">{ins.actionable}</p>
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
