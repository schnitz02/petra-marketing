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
    <div className="space-y-12 animate-fade-in">
      <div>
        <h1 className="text-3xl lg:text-[2.75rem] text-[#1A1A1A] tracking-tight leading-tight">Calendar</h1>
        <p className="text-[#8B8680] text-sm mt-3 font-medium tracking-wide">Scheduled and published posts timeline</p>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-[#E0DFDD] rounded-xl" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E0DFDD] rounded-xl p-16 text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F5F5F3] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#E0DFDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg text-[#1A1A1A] mb-1">No Scheduled Content</h3>
          <p className="text-sm text-[#8B8680] max-w-md mx-auto">
            Content pipeline is not enabled. Enable it in the configuration to start scheduling and publishing posts across platforms.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, i) => (
            <div
              key={i}
              className="bg-white border border-[#E0DFDD] rounded-xl p-4 shadow-sm flex items-center gap-4 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-[#C8956C]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#C8956C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">{event.title || 'Post'}</p>
                <p className="text-xs text-[#8B8680]">{formatDateTime(event.scheduled_at)}</p>
              </div>
              {event.platform && (
                <span className="px-2.5 py-1 rounded-full bg-[#F5F5F3] text-[11px] font-medium text-[#5F6360] uppercase">
                  {event.platform}
                </span>
              )}
              {event.status && (
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                  event.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#D4A76A]/10 text-[#D4A76A]'
                }`}>
                  {event.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
