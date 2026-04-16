import { useState, useEffect, useRef } from 'react'
import api from '../api'
import { formatDateTime } from '../utils/date'

const AGENT_META = {
  research: {
    label: 'Research Agent',
    description: 'Scans 5 competitors for marketing intelligence via Claude AI',
    schedule: 'Daily at 06:00 UTC',
    color: '#C8956C',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  social_stats: {
    label: 'Social Stats Agent',
    description: 'Scrapes LinkedIn for follower metrics and profile data',
    schedule: 'Daily at 09:30 UTC',
    color: '#D4A76A',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  analytics: {
    label: 'Analytics Agent',
    description: 'Fetches post engagement metrics from Meta Graph API',
    schedule: 'Daily at 20:00 UTC',
    color: '#5F6360',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  strategy: {
    label: 'Strategy Agent',
    description: 'Generates marketing ideas from competitive research via Claude AI',
    schedule: 'Weekly on Monday at 07:00 UTC',
    color: '#A87B55',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  website: {
    label: 'Website Agent',
    description: 'Creates website change proposals from approved marketing ideas',
    schedule: 'Daily at 12:00 UTC',
    color: '#8B8680',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
  review: {
    label: 'Review Agent',
    description: 'Analyses daily brand and competitor performance with scored insights via Claude AI',
    schedule: 'Daily at 21:00 UTC',
    color: '#C8956C',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
}

const STATUS_CONFIG = {
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-700', dot: 'bg-red-500', label: 'Failed' },
  running: { bg: 'bg-amber-500/10', text: 'text-amber-700', dot: 'bg-amber-500 animate-pulse-subtle', label: 'Running' },
  never_run: { bg: 'bg-[#F2EDE6]', text: 'text-[#8B8680]', dot: 'bg-[#DDD7CE]', label: 'Never run' },
}

export default function Agents() {
  const [statuses, setStatuses] = useState({})
  const [triggering, setTriggering] = useState({})
  const intervalRef = useRef()

  const fetchStatus = () => {
    api.get('/agents/status').then(r => setStatuses(r.data)).catch(console.error)
  }

  useEffect(() => {
    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 5000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const triggerAgent = async (name) => {
    setTriggering(prev => ({ ...prev, [name]: true }))
    try {
      await api.post(`/agents/trigger/${name}`)
      setTimeout(fetchStatus, 1000)
    } catch (e) {
      console.error(e)
    }
    setTriggering(prev => ({ ...prev, [name]: false }))
  }

  return (
    <div className="space-y-14 animate-fade-in">
      <header className="animate-fade-in-up">
        <p className="label-upper mb-3">Automation</p>
        <h1 className="text-[3rem] lg:text-[3.5rem] tracking-tight leading-none">Agents</h1>
        <p className="text-[#8B8680] text-[15px] mt-4 max-w-lg leading-relaxed">
          Monitor and trigger automated agents &middot; auto-refreshes every 5s
        </p>
        <div className="warm-divider mt-5 max-w-[120px]" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Object.entries(AGENT_META).map(([name, meta], idx) => {
          const status = statuses[name] || { status: 'never_run' }
          const cfg = STATUS_CONFIG[status.status] || STATUS_CONFIG.never_run
          const isTriggering = triggering[name]

          return (
            <div
              key={name}
              className="slab p-0 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              {/* Colored top accent bar */}
              <div className="h-1" style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}80)` }} />

              <div className="p-7">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                      {meta.icon}
                    </div>
                    <h3 className="text-[17px] font-semibold text-[#2C2420]">{meta.label}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                <p className="text-[14px] text-[#8B8680] mb-6 leading-relaxed">{meta.description}</p>

                <div className="space-y-2.5 mb-6">
                  <DetailRow label="Schedule" value={meta.schedule} />
                  <DetailRow
                    label="Last run"
                    value={status.started_at ? formatDateTime(status.started_at) : 'Never'}
                  />
                  {status.completed_at && (
                    <DetailRow label="Completed" value={formatDateTime(status.completed_at)} />
                  )}
                </div>

                {status.log && status.status === 'failed' && (
                  <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[13px] font-mono overflow-x-auto leading-relaxed">
                    {status.log}
                  </div>
                )}

                <button
                  onClick={() => triggerAgent(name)}
                  disabled={isTriggering || status.status === 'running'}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold transition-all cursor-pointer
                    border-2 border-[#DDD7CE] text-[#2C2420]
                    hover:border-[#C8956C] hover:bg-[#C8956C] hover:text-white
                    disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-[#DDD7CE] disabled:hover:bg-transparent disabled:hover:text-[#2C2420]"
                >
                  {isTriggering ? 'Triggering...' : status.status === 'running' ? 'Running...' : 'Trigger Now'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <span className="text-[#8B8680]">{label}</span>
      <span className="font-medium text-[#2C2420]">{value}</span>
    </div>
  )
}
