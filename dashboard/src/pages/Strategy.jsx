import { useState, useEffect } from 'react'
import api from '../api'
import { formatDateTime } from '../utils/date'

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending Review' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Approved' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
}

export default function Strategy() {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [filter, setFilter] = useState('all')

  const fetchIdeas = () => {
    setLoading(true)
    api.get('/approvals/ideas/all')
      .then(r => setIdeas(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(fetchIdeas, [])

  const runStrategy = async () => {
    setRunning(true)
    try {
      await api.post('/agents/trigger/strategy')
      setTimeout(fetchIdeas, 3000)
    } catch (e) {
      console.error(e)
    }
    setRunning(false)
  }

  const approveIdea = async (id) => {
    try {
      await api.post(`/approvals/ideas/${id}/approve`)
      fetchIdeas()
    } catch (e) {
      console.error(e)
    }
  }

  const rejectIdea = async (id) => {
    try {
      await api.post(`/approvals/ideas/${id}/reject`, { notes: '' })
      fetchIdeas()
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.status === filter)

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl lg:text-[2.75rem] text-[#1A1A1A] tracking-tight leading-tight">
            Strategy
          </h1>
          <p className="text-[#8B8680] text-sm mt-3 font-medium tracking-wide">
            AI-generated marketing ideas with approval workflow
          </p>
        </div>
        <button
          onClick={runStrategy}
          disabled={running}
          className="px-5 py-2.5 rounded-lg bg-[#C8956C] text-white text-sm font-medium
            hover:bg-[#b8854f] transition-colors disabled:opacity-50 shadow-sm
            flex items-center gap-2"
        >
          {running ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              Generate Ideas
            </>
          )}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.key
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white border border-[#E0DFDD] text-[#8B8680] hover:border-[#C8956C] hover:text-[#C8956C]'
            }`}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 opacity-60">
                {ideas.filter(i => i.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Ideas list */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-44 bg-[#E0DFDD] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E0DFDD] rounded-xl p-16 text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F5F5F3] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#E0DFDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg text-[#1A1A1A] mb-1">No Ideas Yet</h3>
          <p className="text-sm text-[#8B8680] max-w-md mx-auto">
            Click "Generate Ideas" to have the AI strategy agent create marketing ideas based on your competitor research.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((idea, idx) => {
            const sty = STATUS_STYLES[idea.status] || STATUS_STYLES.pending
            return (
              <div
                key={idea.id}
                className="bg-white border border-[#E0DFDD] rounded-xl p-7 shadow-sm hover:shadow-md transition-all animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[#1A1A1A] leading-snug">{idea.title}</h3>
                    <span className="text-xs text-[#8B8680] mt-1 inline-block">{formatDateTime(idea.created_at)}</span>
                  </div>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium ${sty.bg} ${sty.text}`}>
                    {sty.label}
                  </span>
                </div>

                <p className="text-sm text-[#1A1A1A] leading-relaxed mb-4">{idea.body}</p>

                {idea.evidence && (
                  <div className="pl-4 border-l-2 border-[#C8956C]/25 mb-5">
                    <p className="text-xs font-semibold text-[#C8956C] uppercase tracking-wider mb-1">Evidence</p>
                    <p className="text-sm text-[#5F6360] leading-relaxed">{idea.evidence}</p>
                  </div>
                )}

                {idea.rejection_notes && (
                  <div className="pl-4 border-l-2 border-red-200 mb-5">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Rejection Notes</p>
                    <p className="text-sm text-red-700">{idea.rejection_notes}</p>
                  </div>
                )}

                {idea.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-4 border-t border-[#E0DFDD]">
                    <button
                      onClick={() => approveIdea(idea.id)}
                      className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium
                        hover:bg-emerald-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectIdea(idea.id)}
                      className="px-5 py-2 rounded-lg border border-[#E0DFDD] text-[#8B8680] text-sm font-medium
                        hover:border-red-300 hover:text-red-600 transition-colors"
                    >
                      Reject
                    </button>
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
