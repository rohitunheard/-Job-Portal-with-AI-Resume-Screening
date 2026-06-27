import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const STATS = [
  { value: '24+', label: 'Job Listings' },
  { value: '3', label: 'User Roles' },
  { value: '100%', label: 'Free to Apply' },
  { value: '∞', label: 'Opportunities' },
]

const CATEGORIES = [
  { label: 'Technology', icon: '💻', count: '8 jobs' },
  { label: 'Design', icon: '🎨', count: '3 jobs' },
  { label: 'Marketing', icon: '📣', count: '2 jobs' },
  { label: 'Data Science', icon: '📊', count: '3 jobs' },
  { label: 'Mobile Dev', icon: '📱', count: '2 jobs' },
  { label: 'DevOps', icon: '⚙️', count: '2 jobs' },
  { label: 'Cybersecurity', icon: '🔐', count: '1 job' },
  { label: 'Management', icon: '🏢', count: '3 jobs' },
]

const STEPS_SEEKER = [
  { step: '01', title: 'Create Account', desc: 'Sign up as a job seeker in under a minute with email verification.' },
  { step: '02', title: 'Build Your Profile', desc: 'Upload your resume, photo, skills and qualifications to stand out.' },
  { step: '03', title: 'Apply in One Tap', desc: 'Browse listings and apply instantly — no long forms, just one click.' },
]

const STEPS_EMPLOYER = [
  { step: '01', title: 'Register Company', desc: 'Create an employer account with your company name and details.' },
  { step: '02', title: 'Post Job Opening', desc: 'Fill a simple form with title, description, salary and required skills.' },
  { step: '03', title: 'Find Best Talent', desc: 'Review applications and use AI screening to rank candidates.' },
]

const FEATURES = [
  { icon: '🔐', title: 'OTP Email Verification', desc: 'Every login is secured with a one-time password sent to your email. No unauthorized access.' },
  { icon: '📄', title: 'Resume & Photo Upload', desc: 'Upload your PDF resume and profile photo directly to your profile for employers to view.' },
  { icon: '⚡', title: 'One-Tap Apply', desc: 'Apply to any job with a single button click. Your saved profile is sent automatically.' },
  { icon: '🏢', title: 'Employer Dashboard', desc: 'Post, edit, pause and manage all your job listings from a clean dedicated dashboard.' },
  { icon: '🛡', title: 'Secure Admin Panel', desc: 'Admins can view all applications, user profiles, uploaded resumes in one place.' },
  { icon: '🌐', title: 'Live Job Listings', desc: 'Employer-posted jobs appear instantly on the listings page for all logged-in seekers.' },
]

const JOBS_PREVIEW = [
  { title: 'Frontend React Developer', company: 'Atlas Labs', location: 'Remote', type: 'Full-time', salary: '₹67L - ₹92L' },
  { title: 'Data Scientist', company: 'Insight Analytics', location: 'New York', type: 'Full-time', salary: '₹88L - ₹1.17Cr' },
  { title: 'DevOps Engineer', company: 'CloudBridge', location: 'Hybrid', type: 'Full-time', salary: '₹84L - ₹1.13Cr' },
  { title: 'UI/UX Designer', company: 'Northstar Studio', location: 'Manila', type: 'Contract', salary: '₹46L - ₹63L' },
  { title: 'Machine Learning Engineer', company: 'NeuralEdge', location: 'Remote', type: 'Full-time', salary: '₹1.0Cr - ₹1.34Cr' },
  { title: 'Blockchain Developer', company: 'ChainForge Labs', location: 'Remote', type: 'Full-time', salary: '₹96L - ₹1.26Cr' },
]

// Animated counter hook
function useCounter(target, duration = 1500) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const num = parseInt(target)
    if (isNaN(num)) return
    let start = 0
    const step = num / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= num) { setCount(num); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return count
}

// Intersection observer hook for scroll animations
function useInView(threshold = 0.15) {
  const ref = useRef()
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

export default function Home() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState('seeker')
  const [statsRef, statsInView] = useInView()
  const [featRef, featInView] = useInView()
  const [stepsRef, stepsInView] = useInView()
  const [jobsRef, jobsInView] = useInView()
  const [catRef, catInView] = useInView()

  useEffect(() => {
    const user = localStorage.getItem('jobPortalUser')
    const employer = localStorage.getItem('employerUser')
    if (user || employer) setIsLoggedIn(true)
  }, [])

  const handleGetStarted = () => navigate(isLoggedIn ? '/jobs' : '/login?role=user')

  return (
    <div className="bg-slate-950 text-white overflow-x-hidden">

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[140px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-violet-500/8 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-300 mb-8 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            Now with Live Employer Job Postings
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-tight mb-6"
            style={{ animation: 'fadeInUp 0.8s ease forwards' }}>
            Your Dream Career
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Starts Here
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ animation: 'fadeInUp 0.8s ease 0.2s forwards', opacity: 0 }}>
            Connect with top employers, explore hundreds of opportunities, and take the next step in your career — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16"
            style={{ animation: 'fadeInUp 0.8s ease 0.4s forwards', opacity: 0 }}>
            <button onClick={handleGetStarted}
              className="group relative overflow-hidden rounded-2xl bg-cyan-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400 hover:shadow-cyan-400/30 hover:scale-105">
              <span className="relative z-10">Get Started Free</span>
              <div className="absolute inset-0 -translate-x-full bg-white/10 transition-transform group-hover:translate-x-0" />
            </button>
            <Link to="/login?role=user"
              className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur transition hover:bg-white/10 hover:border-white/20 hover:scale-105">
              Browse Jobs →
            </Link>
            <Link to="/login?role=employer"
              className="rounded-2xl border border-violet-400/30 bg-violet-400/5 px-8 py-4 text-base font-bold text-violet-300 backdrop-blur transition hover:bg-violet-400/10 hover:scale-105">
              Post a Job 🏢
            </Link>
          </div>

          {/* Floating job preview cards */}
          <div className="relative flex justify-center gap-4 flex-wrap"
            style={{ animation: 'fadeInUp 0.8s ease 0.6s forwards', opacity: 0 }}>
            {JOBS_PREVIEW.slice(0, 3).map((job, i) => (
              <Link to="/jobs" key={i}
                className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 text-left w-64 hover:border-cyan-400/40 hover:bg-white/8 transition hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-1">{job.type}</p>
                <p className="font-semibold text-white text-sm leading-snug">{job.title}</p>
                <p className="text-xs text-slate-400 mt-1">{job.company} · {job.location}</p>
                <p className="text-xs font-semibold text-emerald-400 mt-2">{job.salary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section ref={statsRef} className="border-y border-white/5 bg-white/[0.02] py-12 px-6">
        <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <div key={i} className={`transition-all duration-700 ${statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 100}ms` }}>
              <p className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-sm text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED JOBS ───────────────────────────────────── */}
      <section ref={jobsRef} className="py-24 px-6 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className={`text-center mb-14 transition-all duration-700 ${jobsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Opportunities</p>
            <h2 className="text-4xl font-black">Featured Job Listings</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">Hand-picked roles from top companies. Apply in one tap after signing in.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {JOBS_PREVIEW.map((job, i) => (
              <Link to={isLoggedIn ? '/jobs' : '/login'} key={i}
                className={`group rounded-3xl border border-white/10 bg-white/5 p-6 hover:border-cyan-400/40 hover:bg-white/8 hover:-translate-y-1 transition-all duration-300 ${jobsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">
                    💼
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">{job.type}</span>
                </div>
                <h3 className="font-bold text-white text-base leading-snug mb-1">{job.title}</h3>
                <p className="text-sm text-slate-400 mb-3">{job.company}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">📍 {job.location}</span>
                  <span className="font-bold text-emerald-400">{job.salary}</span>
                </div>
                <div className="mt-4 w-full rounded-xl bg-cyan-500/10 border border-cyan-500/20 py-2 text-center text-xs font-bold text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition">
                  Apply Now →
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to={isLoggedIn ? '/jobs' : '/login'}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/5 px-8 py-3 text-sm font-bold text-cyan-400 hover:bg-cyan-400/10 transition hover:scale-105">
              View All 24+ Jobs →
            </Link>
          </div>
        </div>
      </section>

      {/* ── JOB CATEGORIES ──────────────────────────────────── */}
      <section ref={catRef} className="py-24 px-6 sm:px-10 bg-white/[0.02] border-y border-white/5">
        <div className="mx-auto max-w-6xl">
          <div className={`text-center mb-14 transition-all duration-700 ${catInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Explore</p>
            <h2 className="text-4xl font-black">Browse by Category</h2>
            <p className="text-slate-400 mt-3">Find roles that match your expertise</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <Link to={isLoggedIn ? '/jobs' : '/login'} key={i}
                className={`group rounded-2xl border border-white/10 bg-white/5 p-5 text-center hover:border-cyan-400/40 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 ${catInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 60}ms` }}>
                <div className="text-3xl mb-3">{cat.icon}</div>
                <p className="font-bold text-white text-sm">{cat.label}</p>
                <p className="text-xs text-slate-500 mt-1">{cat.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section ref={stepsRef} className="py-24 px-6 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <div className={`text-center mb-14 transition-all duration-700 ${stepsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Simple Process</p>
            <h2 className="text-4xl font-black">How It Works</h2>
          </div>

          {/* Tab toggle */}
          <div className="flex justify-center mb-10">
            <div className="flex rounded-2xl bg-white/5 border border-white/10 p-1 gap-1">
              {['seeker', 'employer'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-6 py-2.5 text-sm font-bold transition capitalize ${activeTab === tab ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {tab === 'seeker' ? '👤 Job Seeker' : '🏢 Employer'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {(activeTab === 'seeker' ? STEPS_SEEKER : STEPS_EMPLOYER).map((s, i) => (
              <div key={i}
                className={`rounded-3xl border border-white/10 bg-white/5 p-7 relative overflow-hidden transition-all duration-500 ${stepsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="absolute top-4 right-4 text-5xl font-black text-white/5 select-none">{s.step}</div>
                <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-400/20 flex items-center justify-center text-cyan-400 font-black text-sm mb-4">{s.step}</div>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to={activeTab === 'seeker' ? '/login?role=user' : '/login?role=employer'}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-105 transition">
              {activeTab === 'seeker' ? 'Start Job Hunting →' : 'Start Hiring →'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section ref={featRef} className="py-24 px-6 sm:px-10 bg-white/[0.02] border-y border-white/5">
        <div className="mx-auto max-w-6xl">
          <div className={`text-center mb-14 transition-all duration-700 ${featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Why Choose Us</p>
            <h2 className="text-4xl font-black">Everything You Need</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">Built with modern technology to give you the best experience.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i}
                className={`rounded-3xl border border-white/10 bg-white/5 p-6 hover:border-cyan-400/30 hover:bg-white/8 transition-all duration-500 ${featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR EMPLOYERS CTA ───────────────────────────────── */}
      <section className="py-24 px-6 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-3xl overflow-hidden border border-violet-400/20 bg-gradient-to-br from-violet-950/80 via-slate-900 to-indigo-950/80 p-10 sm:p-16 text-center">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-violet-500/10 blur-[80px]" />
              <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-indigo-500/10 blur-[80px]" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-4">For Employers</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Hire the Best Talent</h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-8 text-lg">Post unlimited job openings, manage applications, and find the perfect candidate — all from your employer dashboard.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/login?role=employer"
                className="rounded-2xl bg-violet-500 px-8 py-4 text-base font-bold text-white hover:bg-violet-400 transition hover:scale-105 shadow-lg shadow-violet-500/20">
                Start Hiring Free →
              </Link>
              <Link to="/aboutus"
                className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-bold text-white hover:bg-white/10 transition hover:scale-105">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────── */}
      <section className="py-24 px-6 text-center border-t border-white/5">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Ready to Find Your
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Dream Job?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10">Join thousands of professionals who found their next opportunity through our platform.</p>
          <button onClick={handleGetStarted}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-10 py-4 text-base font-black text-white shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-105 transition">
            {isLoggedIn ? 'Browse Jobs Now →' : 'Create Free Account →'}
          </button>
        </div>
      </section>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeInUp 0.8s ease forwards; }
      `}</style>
    </div>
  )
}
