import { useState, useEffect } from 'react'
import api from '../api'
import { formatDateTime } from '../utils/date'

const TYPE_LABELS = {
  blog_post: { label: 'Blog Post', color: '#C8956C' },
  landing_page: { label: 'Landing Page', color: '#D4A76A' },
  banner: { label: 'Banner', color: '#5F6360' },
  case_study: { label: 'Case Study', color: '#8B8680' },
  content_update: { label: 'Content Update', color: '#2C2420' },
}

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-700', label: 'Pending' },
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', label: 'Approved' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-700', label: 'Rejected' },
}

export default function Website() {
  const [changes, setChanges] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [filter, setFilter] = useState('all')

  const fetchChanges = () => {
    setLoading(true)
    api.get('/approvals/website/all')
      .then(r => setChanges(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(fetchChanges, [])

  const runWebsiteAgent = async () => {
    setRunning(true)
    try { await api.post('/agents/trigger/website'); setTimeout(fetchChanges, 3000) } catch (e) { console.error(e) }
    setRunning(false)
  }

  const approveChange = async (id) => {
    try { await api.post(`/approvals/website/${id}/approve`); fetchChanges() } catch (e) { console.error(e) }
  }
  const rejectChange = async (id) => {
    try { await api.post(`/approvals/website/${id}/reject`, { notes: '' }); fetchChanges() } catch (e) { console.error(e) }
  }

  const filtered = filter === 'all' ? changes : changes.filter(c => c.status === filter)

  return (
    <div className="space-y-14 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <header className="animate-fade-in-up">
          <p className="label-upper mb-3">Content Pipeline</p>
          <h1 className="text-[3rem] lg:text-[3.5rem] tracking-tight leading-none">Website</h1>
          <p className="text-[#8B8680] text-[15px] mt-3 max-w-lg leading-relaxed">
            AI-generated website changes from approved marketing ideas
          </p>
          <div className="warm-divider mt-5 max-w-[120px]" />
        </header>
        <button onClick={runWebsiteAgent} disabled={running} className="btn-warm animate-fade-in-up delay-1">
          {running ? (
            <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg>Generating...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>Generate Changes</>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5 animate-fade-in-up delay-2">
        {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`chip ${filter === f.key ? 'chip-active' : ''}`}>
            {f.label}
            {f.key !== 'all' && <span className="opacity-50 ml-1">{changes.filter(c => c.status === f.key).length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-44" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="slab border-dashed p-16 text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#F2EDE6] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#DDD7CE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
          </div>
          <h3 className="text-xl text-[#2C2420] mb-2">No Website Changes</h3>
          <p className="text-[14px] text-[#8B8680] max-w-sm mx-auto leading-relaxed">Approve marketing ideas in Strategy first, then generate website updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((change, idx) => {
            const typeMeta = TYPE_LABELS[change.change_type] || TYPE_LABELS.content_update
            const sty = STATUS_STYLES[change.status] || STATUS_STYLES.pending
            const payload = change.payload || {}

            return (
              <div key={change.id} className="slab p-7 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: typeMeta.color }}>{typeMeta.label}</span>
                    <span className="text-[12px] text-[#8B8680]">{formatDateTime(change.created_at)}</span>
                  </div>
                  <span className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold ${sty.bg} ${sty.text}`}>{sty.label}</span>
                </div>

                <p className="text-[15px] text-[#2C2420] leading-relaxed mb-5">{change.description}</p>

                {(payload.title || payload.content_summary || payload.target_page) && (
                  <div className="bg-[#F2EDE6] border border-[#DDD7CE] rounded-xl p-5 mb-5 space-y-3">
                    {payload.title && (
                      <div>
                        <p className="text-[11px] font-bold text-[#8B8680] uppercase tracking-[0.15em]">Title</p>
                        <p className="text-[14px] text-[#2C2420] font-medium mt-0.5">{payload.title}</p>
                      </div>
                    )}
                    {payload.target_page && (
                      <div>
                        <p className="text-[11px] font-bold text-[#8B8680] uppercase tracking-[0.15em]">Target Page</p>
                        <p className="text-[14px] text-[#C8956C] font-mono mt-0.5">{payload.target_page}</p>
                      </div>
                    )}
                    {payload.content_summary && (
                      <div>
                        <p className="text-[11px] font-bold text-[#8B8680] uppercase tracking-[0.15em]">Content Outline</p>
                        <p className="text-[14px] text-[#5F6360] leading-relaxed mt-0.5">{payload.content_summary}</p>
                      </div>
                    )}
                  </div>
                )}

                {change.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-5 border-t border-[#DDD7CE]">
                    <button onClick={() => approveChange(change.id)} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-colors cursor-pointer">Approve</button>
                    <button onClick={() => rejectChange(change.id)} className="px-5 py-2.5 rounded-xl border-2 border-[#DDD7CE] text-[#8B8680] text-[13px] font-semibold hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer">Reject</button>
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
