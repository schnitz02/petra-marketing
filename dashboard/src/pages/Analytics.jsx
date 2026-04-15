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
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-[#E0DFDD] rounded-lg" />
        <div className="h-64 bg-[#E0DFDD] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-fade-in">
      <div>
        <h1 className="text-3xl lg:text-[2.75rem] text-[#1A1A1A] tracking-tight leading-tight">Analytics</h1>
        <p className="text-[#8B8680] text-sm mt-3 font-medium tracking-wide">Google Analytics 4 integration</p>
      </div>

      {!status?.connected ? (
        <div className="bg-white border border-[#D4A76A]/30 rounded-xl p-8 shadow-sm animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#D4A76A]/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#D4A76A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg text-[#1A1A1A] mb-2">GA4 Not Connected</h3>
              <p className="text-sm text-[#8B8680] mb-4 leading-relaxed">
                Connect Google Analytics to see SEO and SEM metrics. Set the following environment variables:
              </p>
              <div className="bg-[#1A1A1A] rounded-lg p-4 font-mono text-sm text-[#C8956C] space-y-1">
                <p>GA4_PROPERTY_ID=your-property-id</p>
                <p>GA4_CREDENTIALS_JSON=path/to/credentials.json</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1 bg-white border border-[#E0DFDD] rounded-xl p-1 w-fit shadow-sm">
            {['seo', 'sem'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                    : 'text-[#8B8680] hover:text-[#1A1A1A] hover:bg-[#F5F5F3]'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="bg-white border border-[#E0DFDD] rounded-xl p-6 shadow-sm">
            {data?.error ? (
              <p className="text-[#8B8680] text-sm">{data.message || data.error}</p>
            ) : (
              <pre className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
            )}
          </div>
        </>
      )}
    </div>
  )
}
