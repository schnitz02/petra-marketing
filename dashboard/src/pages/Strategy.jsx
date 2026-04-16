import { useState, useEffect } from 'react'
import api from '../api'
import { formatDateTime } from '../utils/date'

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-700', label: 'Pending Review' },
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', label: 'Approved' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-700', label: 'Rejected' },
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
    } catch (e) { console.error(e) }
    setRunning(false)
  }

  const approveIdea = async (id) => {
    try { await api.post(`/approvals/ideas/${id}/approve`); fetchIdeas() } catch (e) { console.error(e) }
  }
  const rejectIdea = async (id) => {
    try { await api.post(`/approvals/ideas/${id}/reject`, { notes: '' }); fetchIdeas() } catch (e) { console.error(e) }
  }

  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.status === filter)

  return (
    <div className="space-y-14 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <header className="animate-fade-in-up">
          <p className="label-upper mb-3">AI Strategy</p>
          <h1 className="text-[3rem] lg:text-[3.5rem] tracking-tight leading-none">Strategy</h1>
          <p className="text-[#8B8680] text-[15px] mt-3 max-w-lg leading-relaxed">
            AI-generated marketing ideas with approval workflow
          </p>
          <div className="warm-divider mt-5 max-w-[120px]" />
        </header>
        <button onClick={runStrategy} disabled={running} className="btn-warm animate-fade-in-up delay-1">
          {running ? (
            <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg>Generating...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>Generate Ideas</>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5 animate-fade-in-up delay-2">
        {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`chip ${filter === f.key ? 'chip-active' : ''}`}>
            {f.label}
            {f.key !== 'all' && <span className="opacity-50 ml-1">{ideas.filter(i => i.status === f.key).length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-44" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="slab border-dashed p-16 text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#F2EDE6] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#DDD7CE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <h3 className="text-xl text-[#2C2420] mb-2">No Ideas Yet</h3>
          <p className="text-[14px] text-[#8B8680] max-w-sm mx-auto leading-relaxed">Click "Generate Ideas" to create marketing ideas based on competitor research.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((idea, idx) => {
            const sty = STATUS_STYLES[idea.status] || STATUS_STYLES.pending
            return (
              <div key={idea.id} className="slab p-7 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[17px] font-semibold text-[#2C2420] leading-snug">{idea.title}</h3>
                    <span className="text-[12px] text-[#8B8680] mt-1 inline-block">{formatDateTime(idea.created_at)}</span>
                  </div>
                  <span className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold ${sty.bg} ${sty.text}`}>{sty.label}</span>
                </div>

                <p className="text-[15px] text-[#2C2420] leading-relaxed mb-4">{idea.body}</p>

                {idea.evidence && (
                  <div className="pl-4 border-l-2 border-[#C8956C]/25 mb-5">
                    <p className="text-[11px] font-bold text-[#C8956C] uppercase tracking-[0.15em] mb-1">Evidence</p>
                    <p className="text-[14px] text-[#5F6360] leading-relaxed">{idea.evidence}</p>
                  </div>
                )}

                {idea.rejection_notes && (
                  <div className="pl-4 border-l-2 border-red-200 mb-5">
                    <p className="text-[11px] font-bold text-red-600 uppercase tracking-[0.15em] mb-1">Rejection Notes</p>
                    <p className="text-[14px] text-red-700">{idea.rejection_notes}</p>
                  </div>
                )}

                {idea.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-5 border-t border-[#DDD7CE]">
                    <button onClick={() => approveIdea(idea.id)} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-colors cursor-pointer">Approve</button>
                    <button onClick={() => rejectIdea(idea.id)} className="px-5 py-2.5 rounded-xl border-2 border-[#DDD7CE] text-[#8B8680] text-[13px] font-semibold hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer">Reject</button>
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
