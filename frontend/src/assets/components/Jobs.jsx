import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// navigate still used for auth redirect

const staticJobs = [
  { id: 'job-1', title: 'Frontend React Developer', company: 'Atlas Labs', location: 'Remote', type: 'Full-time', salary: '₹67L - ₹92L' },
  { id: 'job-2', title: 'UI/UX Designer', company: 'Northstar Studio', location: 'Manila', type: 'Contract', salary: '₹46L - ₹63L' },
  { id: 'job-3', title: 'Node.js Backend Engineer', company: 'Pulse Systems', location: 'Hybrid', type: 'Full-time', salary: '₹75L - ₹1.0Cr' },
  { id: 'job-4', title: 'Junior QA Tester', company: 'BrightWay Digital', location: 'Cebu', type: 'Part-time', salary: '₹25L - ₹38L' },
  { id: 'job-5', title: 'Full Stack Developer', company: 'CodeNest Inc.', location: 'Remote', type: 'Full-time', salary: '₹79L - ₹1.09Cr' },
  { id: 'job-6', title: 'Data Scientist', company: 'Insight Analytics', location: 'New York', type: 'Full-time', salary: '₹88L - ₹1.17Cr' },
  { id: 'job-7', title: 'DevOps Engineer', company: 'CloudBridge', location: 'Hybrid', type: 'Full-time', salary: '₹84L - ₹1.13Cr' },
  { id: 'job-8', title: 'Mobile Developer (React Native)', company: 'AppForge', location: 'Remote', type: 'Contract', salary: '₹59L - ₹79L' },
  { id: 'job-9', title: 'Cybersecurity Analyst', company: 'SecureNet', location: 'Makati', type: 'Full-time', salary: '₹71L - ₹96L' },
  { id: 'job-10', title: 'Product Manager', company: 'LaunchPad Co.', location: 'Singapore', type: 'Full-time', salary: '₹92L - ₹1.21Cr' },
  { id: 'job-11', title: 'Machine Learning Engineer', company: 'NeuralEdge', location: 'Remote', type: 'Full-time', salary: '₹1.0Cr - ₹1.34Cr' },
  { id: 'job-12', title: 'Cloud Solutions Architect', company: 'SkyStack Technologies', location: 'Hybrid', type: 'Full-time', salary: '₹1.09Cr - ₹1.42Cr' },
  { id: 'job-13', title: 'Business Analyst', company: 'Vertex Consulting', location: 'Taguig', type: 'Full-time', salary: '₹50L - ₹67L' },
  { id: 'job-14', title: 'WordPress Developer', company: 'WebCraft Studio', location: 'Remote', type: 'Freelance', salary: '₹33L - ₹50L' },
  { id: 'job-15', title: 'iOS Developer (Swift)', company: 'PixelPeak', location: 'Pasig', type: 'Full-time', salary: '₹71L - ₹96L' },
  { id: 'job-16', title: 'Android Developer (Kotlin)', company: 'Droidworks', location: 'Remote', type: 'Full-time', salary: '₹67L - ₹92L' },
  { id: 'job-17', title: 'Graphic Designer', company: 'VisualCo', location: 'Quezon City', type: 'Part-time', salary: '₹21L - ₹33L' },
  { id: 'job-18', title: 'Technical Support Specialist', company: 'HelpDesk Pro', location: 'Hybrid', type: 'Full-time', salary: '₹29L - ₹42L' },
  { id: 'job-19', title: 'Database Administrator', company: 'DataCore Systems', location: 'Makati', type: 'Full-time', salary: '₹63L - ₹84L' },
  { id: 'job-20', title: 'Scrum Master', company: 'AgileHub', location: 'Remote', type: 'Contract', salary: '₹75L - ₹1.0Cr' },
  { id: 'job-21', title: 'Content Strategist', company: 'BrandVoice Media', location: 'Cebu', type: 'Part-time', salary: '₹25L - ₹38L' },
  { id: 'job-22', title: 'Blockchain Developer', company: 'ChainForge Labs', location: 'Remote', type: 'Full-time', salary: '₹96L - ₹1.26Cr' },
  { id: 'job-23', title: 'Network Engineer', company: 'Netlink Solutions', location: 'Hybrid', type: 'Full-time', salary: '₹59L - ₹79L' },
  { id: 'job-24', title: 'AI Prompt Engineer', company: 'GenAI Works', location: 'Remote', type: 'Contract', salary: '₹71L - ₹1.0Cr' },
]

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Jobs() {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')
  const [appliedJobIds, setAppliedJobIds] = useState([])
  const [isApplying, setIsApplying] = useState(false)
  const [liveJobs, setLiveJobs] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = localStorage.getItem('jobPortalUser')
    if (!savedUser) {
      navigate('/login')
      return
    }
    try {
      setUser(JSON.parse(savedUser))
    } catch {
      localStorage.removeItem('jobPortalUser')
      navigate('/login')
    }
    fetchLiveJobs()
  }, [])

  const fetchLiveJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobpostings`)
      if (res.ok) setLiveJobs(await res.json())
    } catch {}
  }

  const allJobs = [
    ...liveJobs.map(j => ({ id: j._id, title: j.title, company: j.companyName, location: j.location, type: j.type, salary: j.salary, description: j.description, isLive: true })),
    ...staticJobs,
  ]

  const handleApply = async (job) => {
    if (!user) return

    setMessage('')
    setIsApplying(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/jobapplications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not submit application')
      }

      setAppliedJobIds((current) => [...current, job.id])
      setMessage(`Applied to ${job.title} at ${job.company}.`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Available Jobs</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">Welcome{user?.name ? `, ${user.name}` : ''}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Tap any role below to submit your application in one step.
            </p>
          </div>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          {allJobs.map((job) => {
            const isApplied = appliedJobIds.includes(job.id)

            return (
              <article
                key={job.id}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-cyan-950/10 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{job.type}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{job.title}</h2>
                    <p className="mt-2 text-sm text-slate-300">{job.company}</p>
                    {job.isLive && <span className="mt-1 inline-block rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">Employer Posted</span>}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-right">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Salary</p>
                    <p className="mt-1 text-sm font-semibold text-white">{job.salary}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-sm text-slate-300">
                  <span>{job.location}</span>
                  <span>One-tap apply</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleApply(job)}
                  disabled={isApplying || isApplied}
                  className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isApplied
                      ? 'cursor-not-allowed bg-emerald-500/20 text-emerald-200'
                      : 'bg-cyan-500 text-white hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70'
                  }`}
                >
                  {isApplied ? 'Applied' : isApplying ? 'Applying...' : 'Apply Now'}
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}