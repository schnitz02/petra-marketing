import { useState, useEffect } from 'react'
import api from '../api'
import { formatDateTime } from '../utils/date'

const TYPE_LABELS = {
  blog_post: { label: 'Blog Post', color: '#C8956C' },
  landing_page: { label: 'Landing Page', color: '#D4A76A' },
  banner: { label: 'Banner', color: '#5F6360' },
  case_study: { label: 'Case Study', color: '#8B8680' },
  content_update: { label: 'Content Update', color: '#1A1A1A' },
}

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Approved' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
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
    try {
      await api.post('/agents/trigger/website')
      setTimeout(fetchChanges, 3000)
    } catch (e) {
      console.error(e)
    }
    setRunning(false)
  }

  const approveChange = async (id) => {
    try {
      await api.post(`/approvals/website/${id}/approve`)
      fetchChanges()
    } catch (e) {
      console.error(e)
    }
  }

  const rejectChange = async (id) => {
    try {
      await api.post(`/approvals/website/${id}/reject`, { notes: '' })
      fetchChanges()
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = filter === 'all' ? changes : changes.filter(c => c.status === filter)

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl lg:text-[2.75rem] text-[#1A1A1A] tracking-tight leading-tight">
            Website
          </h1>
          <p className="text-[#8B8680] text-sm mt-3 font-medium tracking-wide">
            AI-generated website changes from approved marketing ideas
          </p>
        </div>
        <button
          onClick={runWebsiteAgent}
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              Generate Changes
            </>
          )}
        </button>
      </div>

      {/* Filter */}
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
                {changes.filter(c => c.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Changes list */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-[#E0DFDD] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E0DFDD] rounded-xl p-16 text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F5F5F3] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#E0DFDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h3 className="text-lg text-[#1A1A1A] mb-1">No Website Changes</h3>
          <p className="text-sm text-[#8B8680] max-w-md mx-auto">
            Approve marketing ideas in Strategy first, then click "Generate Changes" to create website updates from those ideas.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((change, idx) => {
            const typeMeta = TYPE_LABELS[change.change_type] || TYPE_LABELS.content_update
            const sty = STATUS_STYLES[change.status] || STATUS_STYLES.pending
            const payload = change.payload || {}

            return (
              <div
                key={change.id}
                className="bg-white border border-[#E0DFDD] rounded-xl p-7 shadow-sm hover:shadow-md transition-all animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-semibold text-white"
                      style={{ backgroundColor: typeMeta.color }}
                    >
                      {typeMeta.label}
                    </span>
                    <span className="text-xs text-[#8B8680]">{formatDateTime(change.created_at)}</span>
                  </div>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium ${sty.bg} ${sty.text}`}>
                    {sty.label}
                  </span>
                </div>

                <p className="text-sm text-[#1A1A1A] leading-relaxed mb-4">{change.description}</p>

                {(payload.title || payload.content_summary || payload.target_page) && (
                  <div className="bg-[#F5F5F3] rounded-lg p-5 mb-5 space-y-2.5">
                    {payload.title && (
                      <div>
                        <p className="text-[11px] font-semibold text-[#8B8680] uppercase tracking-wider">Title</p>
                        <p className="text-sm text-[#1A1A1A] font-medium mt-0.5">{payload.title}</p>
                      </div>
                    )}
                    {payload.target_page && (
                      <div>
                        <p className="text-[11px] font-semibold text-[#8B8680] uppercase tracking-wider">Target Page</p>
                        <p className="text-sm text-[#C8956C] font-mono mt-0.5">{payload.target_page}</p>
                      </div>
                    )}
                    {payload.content_summary && (
                      <div>
                        <p className="text-[11px] font-semibold text-[#8B8680] uppercase tracking-wider">Content Outline</p>
                        <p className="text-sm text-[#5F6360] leading-relaxed mt-0.5">{payload.content_summary}</p>
                      </div>
                    )}
                  </div>
                )}

                {change.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-4 border-t border-[#E0DFDD]">
                    <button
                      onClick={() => approveChange(change.id)}
                      className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium
                        hover:bg-emerald-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectChange(change.id)}
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
