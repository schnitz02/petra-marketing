import { useState, useEffect } from 'react'
import api from '../api'

export default function Analytics() {
  const [status, setStatus] = useState(null)
  const [tab, setTab] = useState('seo')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/ga4/status')
      .then(r => setStatus(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (status?.connected) {
      api.get(`/ga4/${tab}`).then(r => setData(r.data)).catch(console.error)
    }
  }, [tab, status])

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="skeleton h-12 w-48" />
        <div className="skeleton h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-14 animate-fade-in">
      <header className="animate-fade-in-up">
        <p className="label-upper mb-3">Performance</p>
        <h1 className="text-[3rem] lg:text-[3.5rem] tracking-tight leading-none">Analytics</h1>
        <p className="text-[#8B8680] text-[15px] mt-3 max-w-lg leading-relaxed">Google Analytics 4 integration</p>
        <div className="warm-divider mt-5 max-w-[120px]" />
      </header>

      {!status?.connected ? (
        <div className="slab-dark p-8 animate-fade-in-up delay-1">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-[#D4A76A]/15 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-[#D4A76A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl text-[#F2EDE6] mb-2">GA4 Not Connected</h3>
              <p className="text-[14px] text-[#F2EDE6]/40 mb-5 leading-relaxed">
                Connect Google Analytics to see SEO and SEM metrics. Set the following environment variables:
              </p>
              <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-5 font-mono text-[13px] text-[#C8956C] space-y-1.5">
                <p>GA4_PROPERTY_ID=your-property-id</p>
                <p>GA4_CREDENTIALS_JSON=path/to/credentials.json</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1 bg-[#FDFBF7] border border-[#DDD7CE] rounded-xl p-1.5 w-fit shadow-sm animate-fade-in-up delay-1">
            {['seo', 'sem'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                  tab === t
                    ? 'bg-[#2C2420] text-[#F2EDE6] shadow-sm'
                    : 'text-[#8B8680] hover:text-[#2C2420] hover:bg-[#F2EDE6]'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="slab p-7 animate-fade-in-up delay-2">
            {data?.error ? (
              <p className="text-[#8B8680] text-[14px]">{data.message || data.error}</p>
            ) : (
              <pre className="text-[13px] text-[#2C2420] whitespace-pre-wrap font-mono">{JSON.stringify(data, null, 2)}</pre>
            )}
          </div>
        </>
      )}
    </div>
  )
}
