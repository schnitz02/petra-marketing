import { useState, useEffect, useRef } from 'react'
import api from '../api'
import { formatDateTime } from '../utils/date'

const AGENT_META = {
  research: {
    label: 'Research Agent',
    description: 'Scans 5 competitors for marketing intelligence via Claude AI',
    schedule: 'Daily at 06:00 UTC',
    color: '#C8956C',
  },
  social_stats: {
    label: 'Social Stats Agent',
    description: 'Scrapes LinkedIn for follower metrics and profile data',
    schedule: 'Daily at 09:30 UTC',
    color: '#D4A76A',
  },
  analytics: {
    label: 'Analytics Agent',
    description: 'Fetches post engagement metrics from Meta Graph API',
    schedule: 'Daily at 20:00 UTC',
    color: '#5F6360',
  },
  strategy: {
    label: 'Strategy Agent',
    description: 'Generates marketing ideas from competitive research via Claude AI',
    schedule: 'Weekly on Monday at 07:00 UTC',
    color: '#B07D4F',
  },
  website: {
    label: 'Website Agent',
    description: 'Creates website change proposals from approved marketing ideas',
    schedule: 'Daily at 12:00 UTC',
    color: '#8B8680',
  },
}

const STATUS_STYLES = {
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  running: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500 animate-pulse-subtle' },
  never_run: { bg: 'bg-[#F5F5F3]', text: 'text-[#8B8680]', dot: 'bg-[#E0DFDD]' },
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
    <div className="space-y-10 animate-fade-in">
      <div>
        <p className="text-xs font-semibold text-[#C8956C] uppercase tracking-[0.2em] mb-2">Automation</p>
        <h1 className="text-3xl lg:text-4xl text-[#1A1A1A] tracking-tight leading-tight font-bold">Agents</h1>
        <p className="text-[#8B8680] text-base mt-2 font-medium tracking-wide">
          Monitor and trigger automated agents &middot; auto-refreshes every 5s
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(AGENT_META).map(([name, meta], idx) => {
          const status = statuses[name] || { status: 'never_run' }
          const sty = STATUS_STYLES[status.status] || STATUS_STYLES.never_run
          const isTriggering = triggering[name]

          return (
            <div
              key={name}
              className="bg-white border border-[#E0DFDD] rounded-2xl p-7 shadow-sm hover:shadow-md transition-all animate-fade-in-up"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: meta.color }} />
                  <h3 className="text-lg font-semibold text-[#1A1A1A]">{meta.label}</h3>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${sty.bg} ${sty.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sty.dot}`} />
                  {status.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-sm text-[#8B8680] mb-5 leading-relaxed">{meta.description}</p>

              <div className="space-y-2.5 mb-6 text-sm text-[#8B8680]">
                <div className="flex justify-between">
                  <span>Schedule</span>
                  <span className="font-medium text-[#1A1A1A]">{meta.schedule}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last run</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {status.started_at ? formatDateTime(status.started_at) : 'Never'}
                  </span>
                </div>
                {status.completed_at && (
                  <div className="flex justify-between">
                    <span>Completed</span>
                    <span className="font-medium text-[#1A1A1A]">{formatDateTime(status.completed_at)}</span>
                  </div>
                )}
              </div>

              {status.log && status.status === 'failed' && (
                <div className="mb-5 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-mono overflow-x-auto">
                  {status.log}
                </div>
              )}

              <button
                onClick={() => triggerAgent(name)}
                disabled={isTriggering || status.status === 'running'}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all
                  border border-[#E0DFDD] text-[#1A1A1A]
                  hover:bg-[#C8956C] hover:text-white hover:border-[#C8956C]
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isTriggering ? 'Triggering...' : status.status === 'running' ? 'Running...' : 'Trigger Now'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
