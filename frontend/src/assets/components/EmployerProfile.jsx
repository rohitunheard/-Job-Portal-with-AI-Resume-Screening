import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function EmployerProfile() {
  const [employer, setEmployer] = useState(null)
  const [profile, setProfile] = useState({ name: '', companyName: '', website: '', description: '', location: '' })
  const [picFile, setPicFile] = useState(null)
  const [picPreview, setPicPreview] = useState(null)
  const [savedPic, setSavedPic] = useState('')
  const [message, setMessage] = useState({ text: '', ok: true })
  const [submitting, setSubmitting] = useState(false)
  const [searchParams] = useSearchParams()
  const [editing, setEditing] = useState(searchParams.get('edit') === 'true')
  const picRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('employerUser')
    if (!saved) { navigate('/login'); return }
    const emp = JSON.parse(saved)
    setEmployer(emp)
    fetchProfile(emp.email)
  }, [])

  const fetchProfile = async (email) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/by-email/${encodeURIComponent(email)}`)
      if (!res.ok) return
      const data = await res.json()
      setProfile({ name: data.name || '', companyName: data.companyName || '', website: data.website || '', description: data.description || '', location: data.location || '' })
      setSavedPic(data.profilePic || '')
    } catch {}
  }

  const handlePicChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPicFile(file)
    setPicPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!employer) return
    setMessage({ text: '', ok: true })
    setSubmitting(true)
    const formData = new FormData()
    formData.append('email', employer.email)
    formData.append('name', profile.name)
    formData.append('companyName', profile.companyName)
    formData.append('website', profile.website)
    formData.append('description', profile.description)
    formData.append('location', profile.location)
    if (picFile) formData.append('profilePic', picFile)
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/update-profile`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save')
      setSavedPic(data.employer.profilePic || savedPic)
      const updated = { ...employer, name: profile.name, companyName: profile.companyName }
      localStorage.setItem('employerUser', JSON.stringify(updated))
      setEmployer(updated)
      window.dispatchEvent(new Event('employerProfileUpdated'))
      setMessage({ text: 'Profile saved successfully!', ok: true })
      setEditing(false)
    } catch (err) {
      setMessage({ text: err.message, ok: false })
    } finally {
      setSubmitting(false)
    }
  }

  const displayPic = picPreview || (savedPic ? `${API_BASE_URL}/uploads/${savedPic}` : null)

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-2xl">

        {/* Header card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="flex flex-col items-center gap-4">
            {/* Company pic */}
            <div className={`relative group ${editing ? 'cursor-pointer' : ''}`} onClick={() => editing && picRef.current.click()}>
              <div className="h-24 w-24 rounded-2xl border-2 border-violet-400/40 overflow-hidden bg-slate-800 flex items-center justify-center">
                {displayPic ? (
                  <img src={displayPic} alt="Company" className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-12 w-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              </div>
              {editing && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
              <input ref={picRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-semibold">{profile.companyName || employer?.companyName}</h1>
              <p className="text-sm text-slate-400">{employer?.email}</p>
              <span className="mt-1 inline-block rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-0.5 text-xs text-violet-300">Employer</span>
            </div>

            <div className="flex gap-3">
              {!editing ? (
                <>
                  <button onClick={() => setEditing(true)} className="rounded-full border border-violet-400/40 px-5 py-2 text-sm font-semibold text-violet-300 hover:bg-violet-400/10 transition">
                    Edit Profile
                  </button>
                  <button onClick={() => navigate('/change-password')} className="rounded-full border border-violet-400/40 px-5 py-2 text-sm font-semibold text-violet-300 hover:bg-violet-400/10 transition">
                    Change Password
                  </button>
                </>
              ) : (
                <button onClick={() => { setEditing(false); setPicPreview(null); setPicFile(null) }} className="rounded-full border border-white/15 px-5 py-2 text-sm text-slate-300 hover:bg-white/10 transition">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${message.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>
            {message.text}
          </div>
        )}

        {/* View Mode */}
        {!editing && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5 backdrop-blur">
            <Field label="Contact Person" value={profile.name || '—'} />
            <Field label="Location" value={profile.location || '—'} />
            <Field label="Website" value={profile.website ? <a href={profile.website} target="_blank" rel="noreferrer" className="text-violet-400 underline">{profile.website}</a> : '—'} />
            <Field label="About Company" value={profile.description || '—'} />
          </div>
        )}

        {/* Edit Mode */}
        {editing && (
          <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5 backdrop-blur">
            <FormField label="Contact Person Name">
              <input type="text" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} required className="input-style" />
            </FormField>
            <FormField label="Company Name">
              <input type="text" value={profile.companyName} onChange={(e) => setProfile(p => ({ ...p, companyName: e.target.value }))} required className="input-style" />
            </FormField>
            <FormField label="Location">
              <input type="text" value={profile.location} onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Mumbai, Remote" className="input-style" />
            </FormField>
            <FormField label="Website">
              <input type="url" value={profile.website} onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))} placeholder="https://yourcompany.com" className="input-style" />
            </FormField>
            <FormField label="About Company">
              <textarea rows={4} value={profile.description} onChange={(e) => setProfile(p => ({ ...p, description: e.target.value }))} placeholder="Tell job seekers about your company..." className="input-style" />
            </FormField>
            <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:opacity-70 disabled:cursor-not-allowed">
              {submitting ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">{label}</label>
      {children}
    </div>
  )
}
