import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState({ name: '', bio: '', linkedin: '', qualifications: '' })
  const [profilePicFile, setProfilePicFile] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [picPreview, setPicPreview] = useState(null)
  const [savedProfilePic, setSavedProfilePic] = useState('')
  const [savedResume, setSavedResume] = useState('')
  const [message, setMessage] = useState({ text: '', ok: true })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchParams] = useSearchParams()
  const isEditMode = searchParams.get('edit') === 'true'
  const [editing, setEditing] = useState(isEditMode)
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const picInputRef = useRef()
  const navigate = useNavigate()

  async function fetchProfile(email) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/userresume/by-email/${encodeURIComponent(email)}`)
      if (!res.ok) return
      const data = await res.json()
      setProfile({ name: data.name || '', bio: data.bio || '', linkedin: data.linkedin || '', qualifications: data.qualifications || '' })
      setSavedProfilePic(data.profilePic || '')
      setSavedResume(data.resumeFile || '')
    } catch {
      // Profile details are optional for the application list.
    }
  }

  async function fetchApplications() {
    try {
      const token = localStorage.getItem('jobPortalToken');
      const res = await fetch(`${API_BASE_URL}/api/jobapplications/mine`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { navigate('/login'); return; }
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('jobPortalUser')
      if (!saved) { navigate('/login'); return }
      try {
        const u = JSON.parse(saved)
        setUser(u)
        setProfile((p) => ({ ...p, name: u.name || '' }))
        fetchProfile(u.email)
        fetchApplications()
      } catch {
        localStorage.removeItem('jobPortalUser')
        navigate('/login')
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleStartChat = (application) => {
    if (!application?._id) return
    navigate(`/chat?applicationId=${application._id}`, {
      state: { applicationId: application._id },
    })
  }

  const handlePicChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setProfilePicFile(file)
    setPicPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    setMessage({ text: '', ok: true })
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('email', user.email)
    formData.append('name', profile.name)
    formData.append('bio', profile.bio)
    formData.append('linkedin', profile.linkedin)
    formData.append('qualifications', profile.qualifications)
    if (profilePicFile) formData.append('profilePic', profilePicFile)
    if (resumeFile) formData.append('resume', resumeFile)
    try {
      const res = await fetch(`${API_BASE_URL}/api/userresume`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save')
      setSavedProfilePic(data.profile.profilePic || savedProfilePic)
      setSavedResume(data.profile.resumeFile || savedResume)
      const updatedUser = { ...user, name: profile.name }
      localStorage.setItem('jobPortalUser', JSON.stringify(updatedUser))
      setUser(updatedUser)
      window.dispatchEvent(new Event('profileUpdated'))
      setMessage({ text: 'Profile saved successfully!', ok: true })
      setEditing(false)
    } catch (err) {
      setMessage({ text: err.message, ok: false })
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayPic = picPreview || (savedProfilePic ? `${API_BASE_URL}/uploads/${savedProfilePic}` : null)

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10 lg:px-12">
      <div className="mx-auto max-w-2xl">

        {/* Header Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="flex flex-col items-center gap-4">
            {/* Profile Picture */}
            <div
              className={`relative group ${editing ? 'cursor-pointer' : ''}`}
              onClick={() => editing && picInputRef.current.click()}
            >
              <div className="h-24 w-24 rounded-full border-2 border-cyan-400/40 overflow-hidden bg-slate-800 flex items-center justify-center">
                {displayPic ? (
                  <img src={displayPic} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-12 w-12 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>
              {editing && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
              <input ref={picInputRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-semibold">{profile.name || user?.name}</h1>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>

            {/* Edit / View toggle */}
            <div className="flex gap-3">
              {!editing ? (
                <>
                  <button onClick={() => setEditing(true)} className="rounded-full border border-cyan-400/40 px-5 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10 transition">
                    Edit Profile
                  </button>
                  <button onClick={() => navigate('/change-password')} className="rounded-full border border-cyan-400/40 px-5 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10 transition">
                    Change Password
                  </button>
                </>
              ) : (
                <button onClick={() => { setEditing(false); setPicPreview(null); setProfilePicFile(null); setResumeFile(null) }} className="rounded-full border border-white/15 px-5 py-2 text-sm text-slate-300 hover:bg-white/10 transition">
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
            <Field label="Bio / Summary" value={profile.bio || '—'} />
            <Field label="LinkedIn" value={profile.linkedin ? <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-cyan-400 underline">{profile.linkedin}</a> : '—'} />
            <Field label="Qualifications" value={profile.qualifications || '—'} />
            <Field label="Resume" value={
              savedResume
                ? <a href={`${API_BASE_URL}/uploads/${savedResume}`} target="_blank" rel="noreferrer" className="text-cyan-400 underline">View Resume</a>
                : '—'
            } />
          </div>
        )}

        {/* Edit Mode Form */}
        {editing && (
          <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5 backdrop-blur">
            <FormField label="Full Name">
              <input type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required className="input-style" />
            </FormField>

            <FormField label="Bio / Summary">
              <textarea rows={3} value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." className="input-style" />
            </FormField>

            <FormField label="LinkedIn URL">
              <input type="url" value={profile.linkedin} onChange={(e) => setProfile((p) => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/yourprofile" className="input-style" />
            </FormField>

            <FormField label="Qualifications / Skills">
              <textarea rows={3} value={profile.qualifications} onChange={(e) => setProfile((p) => ({ ...p, qualifications: e.target.value }))} placeholder="e.g. B.Sc Computer Science, React, Node.js..." className="input-style" />
            </FormField>

            <FormField label={`Upload Resume (PDF required for applications and AI screening)${savedResume ? ' — current file saved' : ''}`}>
              <input type="file" accept=".pdf,application/pdf" onChange={(e) => setResumeFile(e.target.files[0])} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-400" />
            </FormField>

            <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}

        {/* My Applications Section */}
        {!editing && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-white mb-4">My Applications</h2>
            {appsLoading ? (
              <div className="text-center text-slate-400">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="text-center text-slate-400">You have not applied to any jobs yet.</div>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app._id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{app.jobTitle}</p>
                      <p className="text-sm text-slate-400">{app.company}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        app.status === 'Shortlisted' ? 'bg-emerald-500/15 text-emerald-300' :
                        app.status === 'Rejected' ? 'bg-rose-500/15 text-rose-300' :
                        'bg-violet-500/15 text-violet-300'
                      }`}>
                        {app.status}
                      </span>
                      {app.status === 'Shortlisted' && app.employerId && (
                        <button onClick={() => handleStartChat(app)} className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-400 transition">
                          Chat with Employer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
