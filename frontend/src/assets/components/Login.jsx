import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ADMIN_TOKEN_KEY, USER_TOKEN_KEY, setToken } from '../../utils/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ROLES = [
  {
    key: 'user',
    label: 'Job Seeker',
    desc: 'Find and apply to jobs',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',
    activeColor: 'border-cyan-400 bg-cyan-400/20 text-cyan-300',
    btnColor: 'bg-cyan-500 hover:bg-cyan-400',
  },
  {
    key: 'employer',
    label: 'Employer',
    desc: 'Post jobs & find talent',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'border-violet-400/40 bg-violet-400/10 text-violet-300',
    activeColor: 'border-violet-400 bg-violet-400/20 text-violet-300',
    btnColor: 'bg-violet-500 hover:bg-violet-400',
  },
  {
    key: 'admin',
    label: 'Admin',
    desc: 'Manage the portal',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'border-slate-400/40 bg-slate-400/10 text-slate-300',
    activeColor: 'border-slate-300 bg-slate-400/20 text-slate-200',
    btnColor: 'bg-slate-600 hover:bg-slate-500',
  },
]

export default function Login() {
  const [role, setRole] = useState(null)       // null = role selector screen
  const [mode, setMode] = useState('login')    // login | signup
  const [needsOtp, setNeedsOtp] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [status, setStatus] = useState({ msg: '', ok: true })
  const [loading, setLoading] = useState(false)

  // Forms
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [otpForm, setOtpForm] = useState({ otp: '' })
  const [signupForm, setSignupForm] = useState({ name: '', companyName: '', email: '', password: '', confirmPassword: '' })
  const [adminForm, setAdminForm] = useState({ username: '', password: '' })

  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('jobPortalUser')) navigate('/jobs')
    else if (localStorage.getItem('employerUser')) navigate('/employer/dashboard')
    else if (sessionStorage.getItem('adminUser') && localStorage.getItem(ADMIN_TOKEN_KEY)) navigate('/admin/panel')
  }, [])

  const reset = () => { setStatus({ msg: '', ok: true }); setNeedsOtp(false); setOtpEmail('') }
  const selectedRole = ROLES.find(r => r.key === role)
  const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'

  // ── Submit handlers ──────────────────────────────────────────────────────────

  const submitUserLogin = async (e) => {
    e.preventDefault(); reset(); setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/userlogininfo/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setNeedsOtp(true); setOtpEmail(data.email); setStatus({ msg: data.message, ok: true })
    } catch (err) { setStatus({ msg: err.message, ok: false }) }
    finally { setLoading(false) }
  }

  const submitUserOtp = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/userlogininfo/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp: otpForm.otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      localStorage.setItem('jobPortalUser', JSON.stringify(data.user))
      setToken(USER_TOKEN_KEY, data.token || '')
      navigate('/jobs')
    } catch (err) { setStatus({ msg: err.message, ok: false }) }
    finally { setLoading(false) }
  }

  const submitUserSignup = async (e) => {
    e.preventDefault(); reset()
    if (signupForm.password !== signupForm.confirmPassword)
      return setStatus({ msg: 'Passwords do not match', ok: false })
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/userlogininfo/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupForm.name, email: signupForm.email, password: signupForm.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setStatus({ msg: 'Account created! You can now log in.', ok: true })
      setMode('login'); setLoginForm({ email: signupForm.email, password: '' })
    } catch (err) { setStatus({ msg: err.message, ok: false }) }
    finally { setLoading(false) }
  }

  const submitEmployerLogin = async (e) => {
    e.preventDefault(); reset(); setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setNeedsOtp(true); setOtpEmail(data.email); setStatus({ msg: data.message, ok: true })
    } catch (err) { setStatus({ msg: err.message, ok: false }) }
    finally { setLoading(false) }
  }

  const submitEmployerOtp = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp: otpForm.otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      localStorage.setItem('employerUser', JSON.stringify(data.employer))
      localStorage.setItem('employerToken', data.token || '')
      navigate('/employer/dashboard')
    } catch (err) { setStatus({ msg: err.message, ok: false }) }
    finally { setLoading(false) }
  }

  const submitEmployerSignup = async (e) => {
    e.preventDefault(); reset()
    if (signupForm.password !== signupForm.confirmPassword)
      return setStatus({ msg: 'Passwords do not match', ok: false })
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupForm.name, companyName: signupForm.companyName, email: signupForm.email, password: signupForm.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setStatus({ msg: 'Account created! You can now log in.', ok: true })
      setMode('login'); setLoginForm({ email: signupForm.email, password: '' })
    } catch (err) { setStatus({ msg: err.message, ok: false }) }
    finally { setLoading(false) }
  }

  const submitAdmin = async (e) => {
    e.preventDefault(); reset(); setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setToken(ADMIN_TOKEN_KEY, data.token)
      sessionStorage.setItem('adminUser', JSON.stringify(data.admin))
      navigate('/admin/panel')
    } catch (err) { setStatus({ msg: err.message, ok: false }) }
    finally { setLoading(false) }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-12 text-white">
      <div className="w-full max-w-4xl">

        {/* Back to Home */}
        <Link to="/" className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition w-fit">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/20 backdrop-blur overflow-hidden">

          {/* ── Step 1: Role Selector ── */}
          {!role && (
            <div className="p-8 sm:p-12">
              <div className="text-center mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Welcome</p>
                <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Who are you logging in as?</h1>
                <p className="mt-2 text-sm text-slate-400">Select your role to continue</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
                {ROLES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => { setRole(r.key); reset(); setMode('login') }}
                    className={`flex flex-col items-center gap-3 rounded-2xl border p-6 transition hover:scale-105 ${r.color}`}
                  >
                    <div className={`rounded-xl border p-3 ${r.color}`}>{r.icon}</div>
                    <p className="font-semibold text-white">{r.label}</p>
                    <p className="text-xs text-slate-400 text-center">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Login / Signup Form ── */}
          {role && (
            <div className="grid lg:grid-cols-[1fr_1.1fr]">

              {/* Left info panel */}
              <div className={`relative overflow-hidden p-8 sm:p-10 ${
                role === 'user' ? 'bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600' :
                role === 'employer' ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700' :
                'bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800'
              }`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)]" />
                <div className="relative z-10 h-full flex flex-col justify-between gap-8">
                  <div>
                    <button onClick={() => { setRole(null); reset() }} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition mb-6">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Change role
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="rounded-xl border border-white/20 bg-white/10 p-2">{selectedRole?.icon}</div>
                      <p className="text-lg font-semibold text-white">{selectedRole?.label}</p>
                    </div>
                    <h2 className="text-3xl font-semibold text-white leading-snug">
                      {role === 'user' && 'Find your next opportunity'}
                      {role === 'employer' && 'Hire the best talent'}
                      {role === 'admin' && 'Manage the portal'}
                    </h2>
                    <p className="mt-3 text-sm text-white/75">
                      {role === 'user' && 'Log in or create an account to apply to jobs and manage your profile.'}
                      {role === 'employer' && 'Post job openings and screen candidates with AI.'}
                      {role === 'admin' && 'Access the admin dashboard to view applications and profiles.'}
                    </p>
                  </div>
                  {role === 'admin' && (
                    <p className="text-xs text-white/50">Default: username <span className="text-white/80">admin</span> / password <span className="text-white/80">admin123</span></p>
                  )}
                </div>
              </div>

              {/* Right form panel */}
              <div className="bg-slate-900/90 p-6 sm:p-8">

                {/* Login / Signup tabs (not for admin) */}
                {role !== 'admin' && (
                  <div className="flex rounded-2xl bg-white/5 p-1 text-sm font-semibold mb-6">
                    {['login', 'signup'].map((m) => (
                      <button key={m} type="button"
                        onClick={() => { setMode(m); reset() }}
                        className={`flex-1 rounded-xl px-4 py-2.5 transition capitalize ${mode === m ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}

                {/* Messages */}
                {status.msg && (
                  <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${status.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>
                    {status.msg}
                  </div>
                )}

                {/* ─ Admin form ─ */}
                {role === 'admin' && (
                  <form onSubmit={submitAdmin} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-200">Username</label>
                      <input type="text" value={adminForm.username} onChange={(e) => setAdminForm(f => ({ ...f, username: e.target.value }))} required className={inputClass} placeholder="admin" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                      <input type="password" value={adminForm.password} onChange={(e) => setAdminForm(f => ({ ...f, password: e.target.value }))} required className={inputClass} placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={loading} className={`w-full rounded-xl px-4 py-3 font-semibold text-white transition disabled:opacity-70 disabled:cursor-not-allowed ${selectedRole?.btnColor}`}>
                      {loading ? 'Signing in...' : 'Sign In as Admin'}
                    </button>
                  </form>
                )}

                {/* ─ User / Employer Login ─ */}
                {role !== 'admin' && mode === 'login' && (
                  <>
                    <form onSubmit={role === 'user' ? submitUserLogin : submitEmployerLogin} className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                        <input type="email" value={loginForm.email} onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))} required className={inputClass} placeholder="you@example.com" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                        <input type="password" value={loginForm.password} onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))} required className={inputClass} placeholder="••••••••" />
                      </div>
                      <button type="submit" disabled={loading} className={`w-full rounded-xl px-4 py-3 font-semibold text-white transition disabled:opacity-70 disabled:cursor-not-allowed ${selectedRole?.btnColor}`}>
                        {loading ? 'Sending code...' : 'Send Verification Code'}
                      </button>
                    </form>

                    {needsOtp && (
                      <form onSubmit={role === 'user' ? submitUserOtp : submitEmployerOtp} className="mt-5 space-y-4 border-t border-white/10 pt-5">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-200">Verification Code</label>
                          <input type="text" value={otpForm.otp} onChange={(e) => setOtpForm({ otp: e.target.value })} required maxLength={6} className={inputClass} placeholder="6-digit code" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-70 disabled:cursor-not-allowed">
                          {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                      </form>
                    )}
                  </>
                )}

                {/* ─ User Signup ─ */}
                {role === 'user' && mode === 'signup' && (
                  <form onSubmit={submitUserSignup} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-200">Full Name</label>
                      <input type="text" value={signupForm.name} onChange={(e) => setSignupForm(f => ({ ...f, name: e.target.value }))} required className={inputClass} placeholder="Your name" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                      <input type="email" value={signupForm.email} onChange={(e) => setSignupForm(f => ({ ...f, email: e.target.value }))} required className={inputClass} placeholder="you@example.com" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                        <input type="password" value={signupForm.password} onChange={(e) => setSignupForm(f => ({ ...f, password: e.target.value }))} required className={inputClass} placeholder="Create password" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">Confirm</label>
                        <input type="password" value={signupForm.confirmPassword} onChange={(e) => setSignupForm(f => ({ ...f, confirmPassword: e.target.value }))} required className={inputClass} placeholder="Repeat password" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className={`w-full rounded-xl px-4 py-3 font-semibold text-white transition disabled:opacity-70 disabled:cursor-not-allowed ${selectedRole?.btnColor}`}>
                      {loading ? 'Creating...' : 'Create Account'}
                    </button>
                  </form>
                )}

                {/* ─ Employer Signup ─ */}
                {role === 'employer' && mode === 'signup' && (
                  <form onSubmit={submitEmployerSignup} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">Your Name</label>
                        <input type="text" value={signupForm.name} onChange={(e) => setSignupForm(f => ({ ...f, name: e.target.value }))} required className={inputClass} placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">Company Name</label>
                        <input type="text" value={signupForm.companyName} onChange={(e) => setSignupForm(f => ({ ...f, companyName: e.target.value }))} required className={inputClass} placeholder="Acme Corp" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                      <input type="email" value={signupForm.email} onChange={(e) => setSignupForm(f => ({ ...f, email: e.target.value }))} required className={inputClass} placeholder="company@example.com" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                        <input type="password" value={signupForm.password} onChange={(e) => setSignupForm(f => ({ ...f, password: e.target.value }))} required className={inputClass} placeholder="Create password" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">Confirm</label>
                        <input type="password" value={signupForm.confirmPassword} onChange={(e) => setSignupForm(f => ({ ...f, confirmPassword: e.target.value }))} required className={inputClass} placeholder="Repeat password" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className={`w-full rounded-xl px-4 py-3 font-semibold text-white transition disabled:opacity-70 disabled:cursor-not-allowed ${selectedRole?.btnColor}`}>
                      {loading ? 'Creating...' : 'Create Employer Account'}
                    </button>
                  </form>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
