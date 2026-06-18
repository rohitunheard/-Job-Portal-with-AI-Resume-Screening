import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { setToken, ADMIN_TOKEN_KEY } from '../../utils/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Login failed')
      // Store JWT token + admin info
      setToken(ADMIN_TOKEN_KEY, data.token)
      sessionStorage.setItem('adminUser', JSON.stringify(data.admin))
      navigate('/admin/panel')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      {/* Back to Home */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20">
            <svg className="h-7 w-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Admin Access</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Admin Panel Login</h1>
          <p className="mt-1 text-sm text-slate-400">Restricted to authorized administrators only</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              placeholder="Enter admin username"
              className="input-style"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              placeholder="Enter admin password"
              className="input-style"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In as Admin'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Default credentials — username: <span className="text-slate-300">admin</span> / password: <span className="text-slate-300">admin123</span>
        </p>
      </div>
    </div>
  )
}
