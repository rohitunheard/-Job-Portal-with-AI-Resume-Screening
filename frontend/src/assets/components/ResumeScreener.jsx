import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const JOB_LIST = [
  'Frontend React Developer', 'UI/UX Designer', 'Node.js Backend Engineer',
  'Junior QA Tester', 'Full Stack Developer', 'Data Scientist',
  'DevOps Engineer', 'Mobile Developer (React Native)', 'Cybersecurity Analyst',
  'Product Manager', 'Machine Learning Engineer', 'Cloud Solutions Architect',
  'Business Analyst', 'WordPress Developer', 'iOS Developer (Swift)',
  'Android Developer (Kotlin)', 'Graphic Designer', 'Technical Support Specialist',
  'Database Administrator', 'Scrum Master', 'Content Strategist',
  'Blockchain Developer', 'Network Engineer', 'AI Prompt Engineer',
]

export default function ResumeScreener() {
  const [user, setUser] = useState(null)
  const [file, setFile] = useState(null)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('jobPortalUser')
    if (!saved) { navigate('/login'); return }
    try { setUser(JSON.parse(saved)) } catch { navigate('/login') }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !jobTitle) return
    setError('')
    setResult(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('resume', file)
    formData.append('jobTitle', jobTitle)
    if (jobDescription) formData.append('jobDescription', jobDescription)

    try {
      const res = await fetch(`${API_BASE_URL}/api/resume-screen`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Screening failed')
      setResult(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-cyan-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-rose-400'
  }

  const scoreRingColor = (score) => {
    if (score >= 80) return '#34d399'
    if (score >= 60) return '#22d3ee'
    if (score >= 40) return '#facc15'
    return '#f87171'
  }

  const verdictStyle = (verdict) => {
    if (!verdict) return ''
    const v = verdict.toLowerCase()
    if (v.includes('highly')) return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
    if (v.includes('recommended')) return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
    if (v.includes('needs')) return 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300'
    return 'border-rose-400/30 bg-rose-400/10 text-rose-300'
  }

  const circumference = 2 * Math.PI * 54
  const dashOffset = result ? circumference - (result.score / 100) * circumference : circumference

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10 lg:px-12">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex-shrink-0">
              <svg className="h-6 w-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
<p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Powered by AI (OpenAI)</p>
              <h1 className="text-2xl font-semibold text-white">AI Resume Screener</h1>
              <p className="text-sm text-slate-400 mt-0.5">Upload your resume and get instant AI-powered feedback for any job role.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Form */}
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5 backdrop-blur h-fit">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Select Job Role</label>
              <select
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
              >
                <option value="">-- Choose a job role --</option>
                {JOB_LIST.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Job Description <span className="text-slate-500">(optional)</span></label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description for more accurate screening..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Upload Resume (PDF only)</label>
              <div
                onClick={() => document.getElementById('resume-input').click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${file ? 'border-cyan-400/50 bg-cyan-400/5' : 'border-white/10 hover:border-white/30'}`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="h-5 w-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-cyan-300 font-medium truncate max-w-[180px]">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-8 w-8 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-slate-400">Click to upload your PDF resume</p>
                  </>
                )}
              </div>
              <input id="resume-input" type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !file || !jobTitle}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analyzing Resume...
                </span>
              ) : 'Screen My Resume'}
            </button>
          </form>

          {/* Results */}
          {!result && !loading && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center text-center gap-4 backdrop-blur min-h-[300px]">
              <svg className="h-14 w-14 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-slate-500 text-sm">Your AI analysis will appear here after you upload your resume and click Screen.</p>
            </div>
          )}

          {loading && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center gap-4 backdrop-blur min-h-[300px]">
              <svg className="h-10 w-10 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-slate-400 text-sm">AI is analyzing your resume...</p>
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Score Card */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                    <circle cx="60" cy="60" r="54" fill="none" stroke={scoreRingColor(result.score)} strokeWidth="10"
                      strokeDasharray={circumference} strokeDashoffset={dashOffset}
                      strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${scoreColor(result.score)}`}>{result.score}</span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold mb-2 ${verdictStyle(result.verdict)}`}>
                    {result.verdict}
                  </div>
                  <p className="text-lg font-semibold text-white">Grade: {result.grade}</p>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">{result.summary}</p>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid gap-4 sm:grid-cols-2">
                <ResultSection title="Strengths" items={result.strengths} color="emerald" icon="✓" />
                <ResultSection title="Weaknesses" items={result.weaknesses} color="rose" icon="✗" />
              </div>

              {/* Missing Skills */}
              {result.missingSkills?.length > 0 && (
                <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5">
                  <p className="text-sm font-semibold text-yellow-300 mb-3">Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkills.map((s, i) => (
                      <span key={i} className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                  <p className="text-sm font-semibold text-cyan-300 mb-3">Suggestions to Improve</p>
                  <ul className="space-y-2">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="text-cyan-400 flex-shrink-0">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultSection({ title, items, color, icon }) {
  const styles = {
    emerald: { border: 'border-emerald-400/20 bg-emerald-400/5', title: 'text-emerald-300', item: 'text-emerald-400' },
    rose: { border: 'border-rose-400/20 bg-rose-400/5', title: 'text-rose-300', item: 'text-rose-400' },
  }
  const s = styles[color]
  return (
    <div className={`rounded-2xl border p-5 ${s.border}`}>
      <p className={`text-sm font-semibold mb-3 ${s.title}`}>{title}</p>
      <ul className="space-y-2">
        {items?.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-300">
            <span className={`flex-shrink-0 font-bold ${s.item}`}>{icon}</span> {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
