import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const staticJobs = [
  {
    id: 'remote-frontend',
    title: 'Frontend React Developer',
    company: 'Atlas Labs',
    location: 'Remote',
    type: 'Full-time',
    salary: '$80k - $110k',
  },
  {
    id: 'ui-designer',
    title: 'UI/UX Designer',
    company: 'Northstar Studio',
    location: 'Manila',
    type: 'Contract',
    salary: '$55k - $75k',
  },
  {
    id: 'node-backend',
    title: 'Node.js Backend Engineer',
    company: 'Pulse Systems',
    location: 'Hybrid',
    type: 'Full-time',
    salary: '$90k - $120k',
  },
  {
    id: 'qa-tester',
    title: 'Junior QA Tester',
    company: 'BrightWay Digital',
    location: 'Cebu',
    type: 'Part-time',
    salary: '$30k - $45k',
  },
  {
    id: 'marketing-coordinator',
    title: 'Digital Marketing Coordinator',
    company: 'Skyline Media',
    location: 'Remote',
    type: 'Full-time',
    salary: '$50k - $70k',
  },
  {
    id: 'project-manager',
    title: 'Project Manager',
    company: 'Nexus Works',
    location: 'Davao',
    type: 'Hybrid',
    salary: '$75k - $100k',
  },
]

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Foundjobs() {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')
  const [appliedJobIds, setAppliedJobIds] = useState([])
  const [isApplying, setIsApplying] = useState(false)
  const [liveJobs, setLiveJobs] = useState([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = localStorage.getItem('jobPortalUser')
    if (!savedUser) { navigate('/login'); return }
    try { setUser(JSON.parse(savedUser)) } catch { localStorage.removeItem('jobPortalUser'); navigate('/login') }
    fetchLiveJobs()
  }, [])

  const fetchLiveJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobpostings`)
      if (res.ok) setLiveJobs(await res.json())
    } catch {}
  }

  const allJobs = [
    ...liveJobs.map(j => ({ id: j._id, title: j.title, company: j.companyName, location: j.location, type: j.type, salary: j.salary, description: j.description, skills: j.skills, isLive: true })),
    ...staticJobs,
  ]

  const filtered = allJobs.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase()) ||
    j.location.toLowerCase().includes(search.toLowerCase())
  )

  const handleApply = async (job) => {
    if (!user) return
    setMessage('')
    setIsApplying(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobapplications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, email: user.email, jobTitle: job.title, company: job.company, location: job.location }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not submit application')
      setAppliedJobIds((current) => [...current, job.id])
      setMessage(`Applied to ${job.title} at ${job.company}.`)
    } catch (error) { setMessage(error.message) }
    finally { setIsApplying(false) }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Find Jobs</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">{user?.name ? `Welcome, ${user.name}` : 'Available Jobs'}</h1>
          <p className="mt-2 text-sm text-slate-300">Browse all job openings including live employer-posted roles.</p>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company or location..."
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 max-w-lg"
          />
        </div>

        {message && <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">{message}</div>}

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((job) => {
            const isApplied = appliedJobIds.includes(job.id)
            return (
              <article key={job.id} className="group rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:-translate-y-1 hover:border-cyan-400/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{job.type}</p>
                      {job.isLive && <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">Employer Posted</span>}
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-white">{job.title}</h2>
                    <p className="mt-1 text-sm text-slate-300">{job.company}</p>
                    {job.description && <p className="mt-2 text-xs text-slate-400 line-clamp-2">{job.description}</p>}
                    {job.skills && <p className="mt-1 text-xs text-slate-500">Skills: {job.skills}</p>}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-right flex-shrink-0">
                    <p className="text-xs uppercase tracking-widest text-slate-400">Salary</p>
                    <p className="mt-1 text-sm font-semibold text-white">{job.salary}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                  <span>{job.location}</span>
                  <span>One-tap apply</span>
                </div>
                <button type="button" onClick={() => handleApply(job)} disabled={isApplying || isApplied}
                  className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${isApplied ? 'cursor-not-allowed bg-emerald-500/20 text-emerald-200' : 'bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-70 disabled:cursor-not-allowed'}`}>
                  {isApplied ? 'Applied' : isApplying ? 'Applying...' : 'Apply Now'}
                </button>
              </article>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 py-20 text-center text-slate-500">No jobs found matching your search.</div>
          )}
        </div>
      </div>
    </div>
  )
}