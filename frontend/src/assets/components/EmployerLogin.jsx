import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function EmployerLogin() {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', companyName: '', email: '', password: '', confirmPassword: '' })
  const [otpForm, setOtpForm] = useState({ otp: '' })
  const [needsOtp, setNeedsOtp] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [status, setStatus] = useState({ msg: '', ok: true })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('employerUser')) navigate('/employer/dashboard')
  }, [])

  const reset = () => setStatus({ msg: '', ok: true })

  const submitLogin = async (e) => {
    e.preventDefault(); reset(); setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setNeedsOtp(true)
      setOtpEmail(data.email)
      setStatus({ msg: data.message, ok: true })
    } catch (err) { setStatus({ msg: err.message, ok: false }) }
    finally { setLoading(false) }
  }

  const submitOtp = async (e) => {
    e.preventDefault(); reset(); setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp: otpForm.otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      localStorage.setItem('employerUser', JSON.stringify(data.employer))
      navigate('/employer/dashboard')
    } catch (err) { setStatus({ msg: err.message, ok: false }) }
    finally { setLoading(false) }
  }

  const submitSignup = async (e) => {
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
      setMode('login')
      setLoginForm({ email: signupForm.email, password: '' })
    } catch (err) { setStatus({ msg: err.message, ok: false }) }
    finally { setLoading(false) }
  }

  const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30'

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white flex items-center justify-center">
      <div className="w-full max-w-5xl grid gap-10 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-10 lg:grid-cols-2">

        {/* Left Panel */}
        <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-white/70">For Employers</p>
              <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Post jobs. Find the best talent.</h1>
              <p className="mt-4 text-sm text-white/80 leading-6">Create an employer account, post job openings, and reach thousands of job seekers on our platform.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[['Post Jobs', 'Unlimited openings'], ['Reach Talent', 'Thousands of seekers'], ['AI Screen', 'Best candidates first']].map(([t, s]) => (
                <div key={t} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xl font-semibold">{t}</p>
                  <p className="mt-1 text-xs text-white/70">{s}</p>
                </div>
              ))}
            </div>
            <Link to="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition w-fit">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Home
            </Link>
          </div>
        </section>

        {/* Right Panel */}
        <section className="rounded-[1.75rem] bg-slate-900/90 p-6 shadow-xl ring-1 ring-white/10 sm:p-8">
          <div className="flex rounded-2xl bg-white/5 p-1 text-sm font-semibold mb-6">
            {['login', 'signup'].map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); reset(); setNeedsOtp(false) }}
                className={`flex-1 rounded-xl px-4 py-3 transition capitalize ${mode === m ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}>
                {m === 'login' ? 'Employer Login' : 'Create Account'}
              </button>
            ))}
          </div>

          {status.msg && (
            <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${status.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>
              {status.msg}
            </div>
          )}

          {mode === 'login' ? (
            <>
              <form className="space-y-4" onSubmit={submitLogin}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                  <input type="email" value={loginForm.email} onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))} required className={inputClass} placeholder="company@example.com" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                  <input type="password" value={loginForm.password} onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))} required className={inputClass} placeholder="Enter your password" />
                   <div className="text-right mt-2">
                    <Link to="/forgot-password" state={{ userType: 'employer' }} className="text-sm text-slate-400 hover:text-white">Forgot Password?</Link>
                    </div>
                </div>
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? 'Sending code...' : 'Send Verification Code'}
                </button>
              </form>
              {needsOtp && (
                <form className="mt-6 space-y-4 border-t border-white/10 pt-6" onSubmit={submitOtp}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Verification Code</label>
                    <input type="text" value={otpForm.otp} onChange={(e) => setOtpForm({ otp: e.target.value })} required maxLength={6} className={inputClass} placeholder="Enter 6-digit code" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <form className="space-y-4" onSubmit={submitSignup}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Your Name</label>
                <input type="text" value={signupForm.name} onChange={(e) => setSignupForm(f => ({ ...f, name: e.target.value }))} required className={inputClass} placeholder="John Doe" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Company Name</label>
                <input type="text" value={signupForm.companyName} onChange={(e) => setSignupForm(f => ({ ...f, companyName: e.target.value }))} required className={inputClass} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <input type="email" value={signupForm.email} onChange={(e) => setSignupForm(f => ({ ...f, email: e.target.value }))} required className={inputClass} placeholder="company@example.com" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                  <input type="password" value={signupForm.password} onChange={(e) => setSignupForm(f => ({ ...f, password: e.target.value }))} required className={inputClass} placeholder="Create password" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Confirm Password</label>
                  <input type="password" value={signupForm.confirmPassword} onChange={(e) => setSignupForm(f => ({ ...f, confirmPassword: e.target.value }))} required className={inputClass} placeholder="Repeat password" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Creating...' : 'Create Employer Account'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
