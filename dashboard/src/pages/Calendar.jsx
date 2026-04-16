import { useState, useEffect } from 'react'
import api from '../api'
import { formatDateTime } from '../utils/date'

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/calendar')
      .then(r => setEvents(r.data?.events || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-14 animate-fade-in">
      <header className="animate-fade-in-up">
        <p className="label-upper mb-3">Timeline</p>
        <h1 className="text-[3rem] lg:text-[3.5rem] tracking-tight leading-none">Calendar</h1>
        <p className="text-[#8B8680] text-[15px] mt-3 max-w-lg leading-relaxed">Scheduled and published posts timeline</p>
        <div className="warm-divider mt-5 max-w-[120px]" />
      </header>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : events.length === 0 ? (
        <div className="slab-dark p-12 text-center animate-fade-in-up delay-1">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/[0.05] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#F2EDE6]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl text-[#F2EDE6] mb-2">No Scheduled Content</h3>
          <p className="text-[14px] text-[#F2EDE6]/30 max-w-sm mx-auto leading-relaxed">
            Content pipeline is not enabled. Enable it in the configuration to start scheduling and publishing posts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, i) => (
            <div
              key={i}
              className="slab px-6 py-5 flex items-center gap-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#C8956C]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#C8956C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#2C2420] truncate">{event.title || 'Post'}</p>
                <p className="text-[12px] text-[#8B8680] mt-0.5">{formatDateTime(event.scheduled_at)}</p>
              </div>
              {event.platform && (
                <span className="px-3 py-1 rounded-full bg-[#F2EDE6] border border-[#DDD7CE] text-[11px] font-semibold text-[#5F6360] uppercase">{event.platform}</span>
              )}
              {event.status && (
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                  event.status === 'published' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-[#D4A76A]/10 text-[#D4A76A]'
                }`}>{event.status}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
