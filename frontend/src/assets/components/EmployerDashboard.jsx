import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const EMPTY_FORM = { title: '', description: '', location: '', type: 'Full-time', salary: '', skills: '' }
const TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Hybrid']

export default function EmployerDashboard() {
  const [employer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('employerUser') || 'null')
    } catch {
      return null
    }
  })
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [screeningId, setScreeningId] = useState('')
  const [applicantJobFilter, setApplicantJobFilter] = useState('')
  const [applicantMessage, setApplicantMessage] = useState({ msg: '', ok: true })
  const [status, setStatus] = useState({ msg: '', ok: true })
  const applicantsRef = useRef(null)
  const navigate = useNavigate()

  // Get stored token
  const getToken = () => localStorage.getItem('employerToken') || ''

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  })

  const handleLogout = () => {
    localStorage.removeItem('employerUser')
    localStorage.removeItem('employerToken')
    navigate('/login')
  }

  const fetchJobs = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobpostings/my/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : [])
    } catch (error) {
      setStatus({ msg: error.message || 'Could not load job postings.', ok: false })
    }
  }

  useEffect(() => {
    if (!employer || !getToken()) {
      localStorage.removeItem('employerUser')
      localStorage.removeItem('employerToken')
      navigate('/login')
      return
    }

    const timer = setTimeout(async () => {
      try {
        const [jobsRes, applicationsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/jobpostings/my/${employer.id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          fetch(`${API_BASE_URL}/api/jobapplications/employer`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
        ])

        if (jobsRes.status === 401 || applicationsRes.status === 401) {
          localStorage.removeItem('employerUser')
          localStorage.removeItem('employerToken')
          navigate('/login')
          return
        }

        const jobsData = await jobsRes.json()
        const applicationsData = await applicationsRes.json()
        if (!applicationsRes.ok) throw new Error(applicationsData.message || 'Could not load applicants')
        setJobs(Array.isArray(jobsData) ? jobsData : [])
        setApplications(Array.isArray(applicationsData) ? applicationsData : [])
      } catch (error) {
        setApplicantMessage({ msg: error.message || 'Could not load employer dashboard.', ok: false })
      } finally {
        setApplicationsLoading(false)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [employer, navigate])

  const openApplicants = (jobId = '') => {
    setApplicantJobFilter(jobId)
    setTimeout(() => applicantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const handleScreen = async (applicationId) => {
    setScreeningId(applicationId)
    setApplicantMessage({ msg: '', ok: true })
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobapplications/${applicationId}/screen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'AI screening failed')
      setApplications((current) => current.map((application) =>
        application._id === applicationId
          ? { ...application, aiScreening: data.analysis, screenedAt: data.screenedAt }
          : application
      ))
      setApplicantMessage({ msg: 'AI screening completed for this candidate.', ok: true })
    } catch (err) {
      setApplicantMessage({ msg: err.message, ok: false })
    } finally {
      setScreeningId('')
    }
  }

  const handleApplicationStatus = async (applicationId, nextStatus) => {
    setApplicantMessage({ msg: '', ok: true })
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobapplications/${applicationId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not update candidate status')
      setApplications((current) => current.map((application) =>
        application._id === applicationId ? { ...application, status: data.status } : application
      ))
    } catch (err) {
      setApplicantMessage({ msg: err.message, ok: false })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ msg: '', ok: true })
    try {
      const body = { ...form, employerId: employer.id, companyName: employer.companyName }
      const url = editingId ? `${API_BASE_URL}/api/jobpostings/${editingId}` : `${API_BASE_URL}/api/jobpostings`
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save job')
      setStatus({ msg: editingId ? 'Job updated!' : 'Job posted! It is now visible to job seekers.', ok: true })
      setForm(EMPTY_FORM)
      setEditingId(null)
      setShowForm(false)
      fetchJobs(employer.id)
    } catch (err) {
      setStatus({ msg: err.message, ok: false })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (job) => {
    setForm({ title: job.title, description: job.description, location: job.location, type: job.type, salary: job.salary, skills: job.skills || '' })
    setEditingId(job._id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this job posting?')) return
    try {
      await fetch(`${API_BASE_URL}/api/jobpostings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      fetchJobs(employer.id)
    } catch (error) {
      setStatus({ msg: error.message || 'Could not delete job.', ok: false })
    }
  }

  const handleToggle = async (job) => {
    try {
      await fetch(`${API_BASE_URL}/api/jobpostings/${job._id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !job.isActive })
      })
      fetchJobs(employer.id)
    } catch (error) {
      setStatus({ msg: error.message || 'Could not update job.', ok: false })
    }
  }

  const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/20">
            <svg className="h-5 w-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400">Employer Dashboard</p>
            <p className="text-sm font-semibold">{employer?.companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Site
          </Link>
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); setStatus({ msg: '', ok: true }) }}
            className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 transition">
            + Post Job
          </button>
          <button onClick={() => openApplicants()} className="rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10 transition">
            Applicants ({applications.length})
          </button>
          <button onClick={handleLogout} className="rounded-full border border-rose-500/30 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition">
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          <div className="rounded-2xl border border-violet-400/20 bg-white/5 p-4">
            <p className="text-2xl font-bold text-violet-400">{jobs.length}</p>
            <p className="text-xs text-slate-400 mt-1">Total Postings</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-white/5 p-4">
            <p className="text-2xl font-bold text-emerald-400">{jobs.filter(j => j.isActive).length}</p>
            <p className="text-xs text-slate-400 mt-1">Active Jobs</p>
          </div>
          <div className="rounded-2xl border border-slate-400/20 bg-white/5 p-4">
            <p className="text-2xl font-bold text-slate-400">{jobs.filter(j => !j.isActive).length}</p>
            <p className="text-xs text-slate-400 mt-1">Paused Jobs</p>
          </div>
          <button onClick={() => openApplicants()} className="rounded-2xl border border-cyan-400/20 bg-white/5 p-4 text-left transition hover:bg-cyan-400/10">
            <p className="text-2xl font-bold text-cyan-400">{applications.length}</p>
            <p className="text-xs text-slate-400 mt-1">Total Applicants</p>
          </button>
        </div>

        {/* Empty state with CTA */}
        {!showForm && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 rounded-3xl border border-violet-400/20 bg-white/5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-400/20">
              <svg className="h-8 w-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white text-lg">No job postings yet</p>
              <p className="text-sm text-slate-400 mt-1">Post your first job and reach thousands of seekers instantly.</p>
            </div>
            <button
              onClick={() => { setShowForm(true); setStatus({ msg: '', ok: true }) }}
              className="rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-400 transition">
              + Post Your First Job
            </button>
          </div>
        )}

        {/* Post / Edit Form */}
        {showForm && (
          <div className="rounded-3xl border border-violet-400/20 bg-white/5 p-6 mb-8 backdrop-blur">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Job Posting' : 'Post a New Job'}</h2>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingId(null) }} className="text-slate-400 hover:text-white transition text-sm">✕ Cancel</button>
            </div>

            {status.msg && (
              <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${status.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>
                {status.msg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Job Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required className={inputClass} placeholder="e.g. Senior React Developer" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Location</label>
                  <input type="text" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} required className={inputClass} placeholder="e.g. Remote, Mumbai, Hybrid" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Job Type</label>
                  <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-violet-400">
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Salary (INR)</label>
                  <input type="text" value={form.salary} onChange={(e) => setForm(f => ({ ...f, salary: e.target.value }))} required className={inputClass} placeholder="e.g. ₹8L - ₹12L" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Job Description</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required className={inputClass} placeholder="Describe the role, responsibilities, requirements..." />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Required Skills <span className="text-slate-500">(optional)</span></label>
                <input type="text" value={form.skills} onChange={(e) => setForm(f => ({ ...f, skills: e.target.value }))} className={inputClass} placeholder="e.g. React, Node.js, MongoDB" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Saving...' : editingId ? 'Update Job' : '🚀 Post Job — Visible to Job Seekers Instantly'}
              </button>
            </form>
          </div>
        )}

        {/* Jobs List */}
        {jobs.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-300">Your Job Postings ({jobs.length})</p>
            {jobs.map((job) => (
              <div key={job._id} className={`rounded-3xl border bg-white/5 p-5 backdrop-blur ${job.isActive ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">{job.type}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${job.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'}`}>
                        {job.isActive ? '● Active' : '○ Paused'}
                      </span>
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-white">{job.title}</h3>
                    <p className="text-sm text-slate-400">{job.companyName} · {job.location} · {job.salary}</p>
                    <p className="mt-2 text-sm text-slate-300 line-clamp-2">{job.description}</p>
                    {job.skills && <p className="mt-1 text-xs text-slate-500">Skills: {job.skills}</p>}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => openApplicants(job._id)} className="rounded-xl border border-cyan-400/20 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-400/10 transition">
                      Applicants ({applications.filter((application) => String(application.jobId?._id || application.jobId) === job._id).length})
                    </button>
                    <button onClick={() => handleEdit(job)} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition">Edit</button>
                    <button onClick={() => handleToggle(job)} className={`rounded-xl border px-3 py-1.5 text-xs transition ${job.isActive ? 'border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/10' : 'border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10'}`}>
                      {job.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(job._id)} className="rounded-xl border border-rose-500/20 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition">Delete</button>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-600">Posted {new Date(job.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Applicants Workspace */}
        <section ref={applicantsRef} className="mt-10 scroll-mt-24">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Candidate Pipeline</p>
              <h2 className="mt-1 text-2xl font-semibold">Applied Candidates</h2>
              <p className="mt-1 text-sm text-slate-400">Review résumés, screen candidates against the posted role, and update hiring status.</p>
            </div>
            <select
              value={applicantJobFilter}
              onChange={(event) => setApplicantJobFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
            >
              <option value="">All job postings</option>
              {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
            </select>
          </div>

          {applicantMessage.msg && (
            <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${applicantMessage.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>
              {applicantMessage.msg}
            </div>
          )}

          {applicationsLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-400">Loading applicants...</div>
          ) : applications.filter((application) => !applicantJobFilter || String(application.jobId?._id || application.jobId) === applicantJobFilter).length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <p className="font-semibold text-white">No applications yet</p>
              <p className="mt-1 text-sm text-slate-400">Candidates will appear here as soon as they apply to your posted jobs.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications
                .filter((application) => !applicantJobFilter || String(application.jobId?._id || application.jobId) === applicantJobFilter)
                .map((application) => {
                  const analysis = application.aiScreening
                  const scoreColor = analysis?.score >= 80
                    ? 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10'
                    : analysis?.score >= 60
                      ? 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10'
                      : 'text-amber-300 border-amber-400/30 bg-amber-400/10'

                  return (
                    <article key={application._id} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">{application.name}</h3>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              application.status === 'Shortlisted'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : application.status === 'Rejected'
                                  ? 'bg-rose-500/15 text-rose-300'
                                  : 'bg-violet-500/15 text-violet-300'
                            }`}>{application.status}</span>
                            {analysis && <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${scoreColor}`}>AI Match {analysis.score}%</span>}
                          </div>
                          <p className="mt-1 text-sm text-slate-300">{application.email}</p>
                          <p className="mt-3 text-sm font-medium text-cyan-300">{application.jobId?.title || application.jobTitle}</p>
                          <p className="text-xs text-slate-500">Applied {new Date(application.createdAt).toLocaleDateString()}</p>

                          {analysis && (
                            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-white">{analysis.verdict}</span>
                                <span className="text-xs text-slate-500">Grade {analysis.grade}</span>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-slate-300">{analysis.summary}</p>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Strengths</p>
                                  <p className="mt-1 text-xs text-slate-400">{analysis.strengths?.join(' • ') || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Missing skills</p>
                                  <p className="mt-1 text-xs text-slate-400">{analysis.missingSkills?.join(' • ') || 'None identified'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex w-full flex-col gap-2 lg:w-48">
                          <a
                            href={`${API_BASE_URL}/uploads/${application.resumeFile}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                          >
                            View Résumé
                          </a>
                          <button
                            onClick={() => handleScreen(application._id)}
                            disabled={screeningId === application._id}
                            className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {screeningId === application._id ? 'Screening with AI...' : analysis ? 'Run AI Again' : 'Screen with AI'}
                          </button>
                          <select
                            value={application.status}
                            onChange={(event) => handleApplicationStatus(application._id, event.target.value)}
                            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-violet-400"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    </article>
                  )
                })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
