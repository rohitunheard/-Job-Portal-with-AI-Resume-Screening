import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { USER_TOKEN_KEY, getToken, removeToken } from '../../utils/auth'
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
const keyPart = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
const applicationKeyFor = (job) => job.isLive
  ? `job:${job.id}`
  : `static:${keyPart(job.title)}:${keyPart(job.company)}:${keyPart(job.location)}`

export default function Jobs() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jobPortalUser') || 'null')
    } catch {
      return null
    }
  })
  const [message, setMessage] = useState('')
  const [applications, setApplications] = useState([])
  const [applyingJobId, setApplyingJobId] = useState('')
  const [liveJobs, setLiveJobs] = useState([])
  const [resumeReady, setResumeReady] = useState(false)
  const [profileChecked, setProfileChecked] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || !getToken(USER_TOKEN_KEY)) {
      localStorage.removeItem('jobPortalUser')
      removeToken(USER_TOKEN_KEY)
      navigate('/login')
      return
    }

    const loadCandidateState = async () => {
      try {
        const [profileRes, applicationsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/userresume/by-email/${encodeURIComponent(user.email)}`),
          fetch(`${API_BASE_URL}/api/jobapplications/mine`, {
            headers: { Authorization: `Bearer ${getToken(USER_TOKEN_KEY)}` },
          }),
        ])

        if (applicationsRes.status === 401) {
          localStorage.removeItem('jobPortalUser')
          removeToken(USER_TOKEN_KEY)
          navigate('/login')
          return
        }

        if (profileRes.ok) {
          const profile = await profileRes.json()
          setResumeReady(Boolean(profile.resumeFile?.toLowerCase().endsWith('.pdf')))
        }
        if (applicationsRes.ok) {
          const applications = await applicationsRes.json()
          setApplications(Array.isArray(applications) ? applications : [])
        }
      } catch (error) {
        setMessage(error.message || 'Could not load your application information.')
      } finally {
        setProfileChecked(true)
      }
    }

    const fetchLiveJobs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/jobpostings`)
        if (res.ok) setLiveJobs(await res.json())
      } catch (error) {
        setMessage(error.message || 'Could not load employer-posted jobs.')
      }
    }

    loadCandidateState()
    fetchLiveJobs()
  }, [navigate, user])

  const allJobs = [
    ...liveJobs.map(j => ({ id: j._id, title: j.title, company: j.companyName, location: j.location, type: j.type, salary: j.salary, description: j.description, isLive: true })),
    ...staticJobs,
  ]

  const applicationByKey = useMemo(() => {
    return new Map(applications.map((application) => [application.applicationKey, application]))
  }, [applications])

  const handleApply = async (job) => {
    if (!user) return
    if (!resumeReady) {
      navigate('/profile?edit=true')
      return
    }

    setMessage('')
    setApplyingJobId(job.id)

    try {
      const response = await fetch(`${API_BASE_URL}/api/jobapplications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken(USER_TOKEN_KEY)}`,
        },
        body: JSON.stringify(job.isLive
          ? { jobId: job.id }
          : {
              staticJobId: job.id,
              jobTitle: job.title,
              company: job.company,
              location: job.location,
            }),
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('jobPortalUser')
        removeToken(USER_TOKEN_KEY)
        navigate('/login')
        return
      }
      if (!response.ok) {
        throw new Error(data.message || 'Could not submit application')
      }

      setApplications((current) => [data, ...current])
      setMessage(`Applied to ${job.title} at ${job.company}.`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setApplyingJobId('')
    }
  }

  const openChat = (application) => {
    if (!application?._id) return
    navigate(`/chat?applicationId=${application._id}`, {
      state: { applicationId: application._id },
    })
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

        {profileChecked && !resumeReady && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <span>You must upload a PDF résumé before applying so employers can use AI screening.</span>
            <Link to="/profile?edit=true" className="font-semibold text-amber-300 underline underline-offset-4">
              Upload résumé
            </Link>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          {allJobs.map((job) => {
            const applicationKey = applicationKeyFor(job)
            const application = applicationByKey.get(applicationKey)
            const isApplied = Boolean(application)
            const isApplying = applyingJobId === job.id
            const canChat = application?.status === 'Shortlisted' && application?.employerId

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

                <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-300">
                  <span>{job.location}</span>
                  {isApplied ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      application.status === 'Shortlisted'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : application.status === 'Rejected'
                          ? 'bg-rose-500/15 text-rose-300'
                          : 'bg-violet-500/15 text-violet-300'
                    }`}>
                      {application.status}
                    </span>
                  ) : (
                    <span>One-tap apply</span>
                  )}
                </div>
                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleApply(job)}
                    disabled={Boolean(applyingJobId) || isApplied}
                    className={`min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isApplied
                        ? 'cursor-not-allowed bg-emerald-500/20 text-emerald-200'
                        : 'bg-cyan-500 text-white hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70'
                    }`}
                  >
                    {isApplied ? 'Applied' : isApplying ? 'Applying...' : !resumeReady ? 'Upload Resume to Apply' : 'Apply Now'}
                  </button>
                  {canChat && (
                    <button
                      type="button"
                      onClick={() => openChat(application)}
                      className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white transition hover:bg-sky-400"
                      title="Chat with employer"
                      aria-label="Chat with employer"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72A7.45 7.45 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
