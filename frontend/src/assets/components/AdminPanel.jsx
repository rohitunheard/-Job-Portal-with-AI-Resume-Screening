import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_TOKEN_KEY, authHeader, getToken, removeToken } from '../../utils/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function AdminPanel() {
  const [tab, setTab] = useState('applications')
  const [applications, setApplications] = useState([])
  const [profiles, setProfiles] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState(null)
  const navigate = useNavigate()


  useEffect(() => {
    const saved = sessionStorage.getItem('adminUser')
    const token = getToken(ADMIN_TOKEN_KEY)
    if (!saved || !token) { handleLogout(); return }

    try {
      setAdmin(JSON.parse(saved))
    } catch {
      handleLogout()
      return
    }

    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [appsRes, profilesRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/applications`, { headers: authHeader(ADMIN_TOKEN_KEY) }),
        fetch(`${API_BASE_URL}/api/admin/profiles`, { headers: authHeader(ADMIN_TOKEN_KEY) }),
        fetch(`${API_BASE_URL}/api/admin/users`, { headers: authHeader(ADMIN_TOKEN_KEY) }),
      ])

      const unauthorized = [appsRes, profilesRes, usersRes].some(
        (r) => r.status === 401 || r.status === 403
      )
      if (unauthorized) {
        handleLogout()
        return
      }

      const appsData = await appsRes.json()
      const profilesData = await profilesRes.json()
      const usersData = await usersRes.json()

      setApplications(Array.isArray(appsData) ? appsData : [])
      setProfiles(Array.isArray(profilesData) ? profilesData : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Generic delete helper for admin-protected DELETE endpoints
  const adminDelete = async (endpoint) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/${endpoint}`, {
      method: 'DELETE',
      headers: authHeader(ADMIN_TOKEN_KEY),
    })
    if (res.status === 401 || res.status === 403) {
      handleLogout()
      return false
    }
    return res.ok
  }

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Delete this job application? This cannot be undone.')) return
    if (await adminDelete(`applications/${id}`)) {
      setApplications((prev) => prev.filter((a) => a._id !== id))
    } else {
      alert('Failed to delete application.')
    }
  }

  const handleDeleteProfile = async (id) => {
    if (!window.confirm('Delete this user profile and resume? This cannot be undone.')) return
    if (await adminDelete(`profiles/${id}`)) {
      setProfiles((prev) => prev.filter((p) => p._id !== id))
    } else {
      alert('Failed to delete profile.')
    }
  }

  const handleDeleteUser = async (user) => {
    if (
      !window.confirm(
        `Delete user "${user.name || user.email}"?\n\nThis will permanently remove their account, profile, resume and all job applications. This cannot be undone.`
      )
    )
      return
    if (await adminDelete(`users/${user._id}`)) {
      setUsers((prev) => prev.filter((u) => u._id !== user._id))
      // Also drop any related profile/applications from local state
      setProfiles((prev) => prev.filter((p) => p.email !== user.email))
      setApplications((prev) => prev.filter((a) => a.email !== user.email))
    } else {
      alert('Failed to delete user.')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminUser')
    removeToken(ADMIN_TOKEN_KEY)
    navigate('/admin')
  }


  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-400/20">
            <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400">Admin Panel</p>
            <p className="text-sm font-semibold text-white">{admin?.username}</p>
          </div>
        </div>
        <button onClick={() => navigate('/change-password')} className="rounded-full border border-cyan-500/30 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/10 transition">
          Change Password
        </button>
        <button onClick={handleLogout} className="rounded-full border border-rose-500/30 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition">
          Log out
        </button>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-8">
          <StatCard label="Total Applications" value={applications.length} color="cyan" />
          <StatCard label="User Profiles" value={profiles.length} color="indigo" />
          <StatCard label="User Accounts" value={users.length} color="rose" />
          <StatCard label="Resumes Uploaded" value={profiles.filter((p) => p.resumeFile).length} color="emerald" />
          <StatCard label="Profile Pics" value={profiles.filter((p) => p.profilePic).length} color="violet" />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap rounded-2xl bg-white/5 p-1 text-sm font-semibold mb-6 w-fit gap-1">
          <TabBtn active={tab === 'applications'} onClick={() => setTab('applications')}>
            Job Applications ({applications.length})
          </TabBtn>
          <TabBtn active={tab === 'profiles'} onClick={() => setTab('profiles')}>
            User Profiles ({profiles.length})
          </TabBtn>
          <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>
            User Accounts ({users.length})
          </TabBtn>
          <TabBtn active={tab === 'screening'} onClick={() => setTab('screening')} ai>
            🤖 AI Resume Screening
          </TabBtn>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>
        ) : tab === 'applications' ? (
          <ApplicationsTable data={applications} onDelete={handleDeleteApplication} />
        ) : tab === 'profiles' ? (
          <ProfilesTable data={profiles} onDelete={handleDeleteProfile} />
        ) : tab === 'users' ? (
          <UsersTable data={users} onDelete={handleDeleteUser} />
        ) : (
          <AIScreeningTab profiles={profiles} />
        )}
      </div>
    </div>
  )
}

// ─── AI Screening Tab ────────────────────────────────────────────────────────
function AIScreeningTab({ profiles }) {
  const [jobTitle, setJobTitle] = useState('')
  const [results, setResults] = useState([])
  const [screening, setScreening] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState('')

  const resumeProfiles = profiles.filter((p) => p.resumeFile)

  const runScreening = async () => {
    if (!jobTitle || !resumeProfiles.length) return
    setError('')
    setResults([])
    setScreening(true)
    setProgress({ current: 0, total: resumeProfiles.length })

    const screenedResults = []

    for (let i = 0; i < resumeProfiles.length; i++) {
      const p = resumeProfiles[i]
      setProgress({ current: i + 1, total: resumeProfiles.length })

      try {
        // Fetch the resume file as blob then send to AI
        const fileRes = await fetch(`${API_BASE_URL}/uploads/${p.resumeFile}`)
        const blob = await fileRes.blob()
        const file = new File([blob], p.resumeFile, { type: 'application/pdf' })

        const formData = new FormData()
        formData.append('resume', file)
        formData.append('jobTitle', jobTitle)
        if (p.qualifications) formData.append('jobDescription', `Candidate qualifications: ${p.qualifications}`)

        const res = await fetch(`${API_BASE_URL}/api/resume-screen`, { method: 'POST', body: formData })
        const data = await res.json()

        if (res.ok && data.analysis) {
          screenedResults.push({ profile: p, analysis: data.analysis })
        } else {
          screenedResults.push({ profile: p, error: data.message || 'Failed to screen' })
        }
      } catch (err) {
        screenedResults.push({ profile: p, error: 'Could not fetch or screen resume' })
      }
    }

    // Sort by score descending
    screenedResults.sort((a, b) => (b.analysis?.score || 0) - (a.analysis?.score || 0))
    setResults(screenedResults)
    setScreening(false)
  }

  const scoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-cyan-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-rose-400'
  }

  const ringColor = (score) => {
    if (score >= 80) return '#34d399'
    if (score >= 60) return '#22d3ee'
    if (score >= 40) return '#facc15'
    return '#f87171'
  }

  const verdictStyle = (verdict = '') => {
    const v = verdict.toLowerCase()
    if (v.includes('highly')) return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
    if (v.includes('recommended')) return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
    if (v.includes('needs')) return 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300'
    return 'border-rose-400/30 bg-rose-400/10 text-rose-300'
  }

  const circumference = 2 * Math.PI * 28

  if (!resumeProfiles.length) {
    return <Empty message="No resumes uploaded by users yet. Users need to upload their resumes in their profile." />
  }

  return (
    <div className="space-y-6">
      {/* Control */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-400/20">
            <svg className="h-5 w-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white">AI Resume Screening</p>
            <p className="text-xs text-slate-400">Automatically screen all {resumeProfiles.length} uploaded resumes and rank candidates by score</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Enter job role to screen for (e.g. Frontend React Developer)"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
          />
          <button
            onClick={runScreening}
            disabled={screening || !jobTitle}
            className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {screening ? 'Screening...' : 'Run AI Screening'}
          </button>
        </div>

        {/* Progress bar */}
        {screening && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Screening resume {progress.current} of {progress.total}...</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-white">Ranked Results for: <span className="text-cyan-400">{jobTitle}</span></p>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-xs text-slate-400">{results.length} candidates</span>
          </div>

          {results.map((r, i) => (
            <div key={r.profile._id} className={`rounded-3xl border bg-white/5 p-5 backdrop-blur ${i === 0 ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-white/10'}`}>
              {/* Rank badge + profile */}
              <div className="flex items-start gap-4">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? 'bg-emerald-400 text-slate-900' : i === 1 ? 'bg-slate-400 text-slate-900' : i === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-slate-400'}`}>
                  {i + 1}
                </div>

                {/* Profile pic + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10 bg-slate-700 flex-shrink-0 flex items-center justify-center">
                    {r.profile.profilePic ? (
                      <img src={`${API_BASE_URL}/uploads/${r.profile.profilePic}`} alt={r.profile.name} className="h-full w-full object-cover" />
                    ) : (
                      <svg className="h-5 w-5 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{r.profile.name}</p>
                    <p className="text-xs text-slate-400 truncate">{r.profile.email}</p>
                  </div>
                </div>

                {/* Score ring */}
                {r.analysis && (
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <div className="relative">
                      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke={ringColor(r.analysis.score)} strokeWidth="6"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference - (r.analysis.score / 100) * circumference}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-sm font-bold ${scoreColor(r.analysis.score)}`}>{r.analysis.score}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{r.analysis.grade}</p>
                      <div className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${verdictStyle(r.analysis.verdict)}`}>
                        {r.analysis.verdict}
                      </div>
                    </div>
                  </div>
                )}

                {r.error && (
                  <span className="text-xs text-rose-400 flex-shrink-0">{r.error}</span>
                )}
              </div>

              {/* Summary + details */}
              {r.analysis && (
                <div className="mt-4 pl-11 space-y-3">
                  <p className="text-sm text-slate-300 leading-relaxed">{r.analysis.summary}</p>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {r.analysis.strengths?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 mb-1">Strengths</p>
                        <ul className="space-y-0.5">
                          {r.analysis.strengths.slice(0, 3).map((s, j) => (
                            <li key={j} className="text-xs text-slate-300 flex gap-1"><span className="text-emerald-400">✓</span>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.analysis.missingSkills?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-yellow-400 mb-1">Missing Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {r.analysis.missingSkills.slice(0, 4).map((s, j) => (
                            <span key={j} className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-200">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <a href={`${API_BASE_URL}/uploads/${r.profile.resumeFile}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Full Resume
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Shared Components ────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  const colors = { cyan: 'border-cyan-400/20 text-cyan-400', indigo: 'border-indigo-400/20 text-indigo-400', emerald: 'border-emerald-400/20 text-emerald-400', violet: 'border-violet-400/20 text-violet-400', rose: 'border-rose-400/20 text-rose-400' }
  return (
    <div className={`rounded-2xl border bg-white/5 p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  )
}

function TabBtn({ active, onClick, children, ai }) {
  return (
    <button onClick={onClick}
      className={`rounded-xl px-5 py-2.5 transition ${active ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  )
}

function ApplicationsTable({ data, onDelete }) {
  if (!data.length) return <Empty message="No job applications yet." />
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-widest text-slate-400">
              <th className="px-5 py-4">#</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Job Title</th>
              <th className="px-5 py-4">Company</th>
              <th className="px-5 py-4">Location</th>
              <th className="px-5 py-4">Applied On</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((app, i) => (
              <tr key={app._id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-5 py-4 text-slate-400">{i + 1}</td>
                <td className="px-5 py-4 font-medium text-white">{app.name}</td>
                <td className="px-5 py-4 text-slate-300">{app.email}</td>
                <td className="px-5 py-4 text-cyan-300">{app.jobTitle}</td>
                <td className="px-5 py-4 text-slate-300">{app.company}</td>
                <td className="px-5 py-4 text-slate-300">{app.location}</td>
                <td className="px-5 py-4 text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => onDelete(app._id)}
                    className="rounded-full border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProfilesTable({ data, onDelete }) {
  if (!data.length) return <Empty message="No user profiles uploaded yet." />
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((p) => (
        <div key={p._id} className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full overflow-hidden border border-cyan-400/30 bg-slate-700 flex-shrink-0 flex items-center justify-center">
              {p.profilePic ? (
                <img src={`${API_BASE_URL}/uploads/${p.profilePic}`} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <svg className="h-6 w-6 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-semibold text-white">{p.name}</p>
              <p className="text-xs text-slate-400">{p.email}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {p.bio && <><p className="text-xs text-slate-500">Bio</p><p className="text-slate-300 text-xs line-clamp-2">{p.bio}</p></>}
            {p.qualifications && <><p className="text-xs text-slate-500">Qualifications</p><p className="text-slate-300 text-xs line-clamp-2">{p.qualifications}</p></>}
            {p.linkedin && <a href={p.linkedin} target="_blank" rel="noreferrer" className="text-cyan-400 underline text-xs block truncate">{p.linkedin}</a>}
          </div>
          <div>
            {p.resumeFile ? (
              <a href={`${API_BASE_URL}/uploads/${p.resumeFile}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-500/20 transition">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Resume
              </a>
            ) : <span className="text-xs text-slate-500 italic">No resume uploaded</span>}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600">Joined {new Date(p.createdAt).toLocaleDateString()}</p>
            <button
              onClick={() => onDelete(p._id)}
              className="rounded-full border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function UsersTable({ data, onDelete }) {
  if (!data.length) return <Empty message="No user accounts registered yet." />
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-widest text-slate-400">
              <th className="px-5 py-4">#</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Joined On</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((user, i) => (
              <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-5 py-4 text-slate-400">{i + 1}</td>
                <td className="px-5 py-4 font-medium text-white">{user.name}</td>
                <td className="px-5 py-4 text-slate-300">{user.email}</td>
                <td className="px-5 py-4 text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => onDelete(user)}
                    className="rounded-full border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition"
                  >
                    Delete User
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Empty({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  )
}
