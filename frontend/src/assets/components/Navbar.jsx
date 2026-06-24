import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client';
import { ADMIN_TOKEN_KEY, EMPLOYER_TOKEN_KEY, USER_TOKEN_KEY, authHeader, getToken, removeToken } from '../../utils/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Navbar() {
  const [user, setUser] = useState(null)           // regular user
  const [employer, setEmployer] = useState(null)   // employer
  const [admin, setAdmin] = useState(null)         // admin
  const [profilePic, setProfilePic] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0);
  const dropdownRef = useRef()
  const notificationsRef = useRef()
  const socket = useRef();
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const loggedInUser = user || employer;
    const role = user ? 'user' : employer ? 'employer' : ''

    if (loggedInUser?.id && role) {
      socket.current = io(API_BASE_URL);
      socket.current.emit('addUser', { userId: loggedInUser.id, role });

      socket.current.on('notification:new', (notification) => {
        setNotifications((current) => [notification, ...current.filter((item) => item._id !== notification._id)].slice(0, 30))
        setNotificationCount((current) => current + 1)
        if (notification.type === 'message' && location.pathname !== '/chat') {
          setUnreadMessages((current) => current + 1)
        }
      });
  
      return () => {
        socket.current.disconnect();
      };
    }
  }, [user, employer, location.pathname]);
  
  useEffect(() => {
    if (location.pathname === '/chat') {
      const timer = setTimeout(() => setUnreadMessages(0), 0)
      return () => clearTimeout(timer)
    }
  }, [location.pathname]);

  const activeTokenKey = user ? USER_TOKEN_KEY : employer ? EMPLOYER_TOKEN_KEY : null

  const fetchNotifications = async () => {
    if (!activeTokenKey || !getToken(activeTokenKey)) {
      setNotifications([])
      setNotificationCount(0)
      setUnreadMessages(0)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: authHeader(activeTokenKey),
      })
      if (!res.ok) return
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setNotifications(list)
      setNotificationCount(list.filter((notification) => !notification.read).length)
      setUnreadMessages(list.filter((notification) => !notification.read && notification.type === 'message').length)
    } catch {
      // Leave notification badges unchanged if the API is temporarily unavailable.
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchNotifications, 0)
    return () => clearTimeout(timer)
  }, [user, employer])


  const loadAuth = () => {
    const savedUser = localStorage.getItem('jobPortalUser')
    const savedEmployer = localStorage.getItem('employerUser')
    const savedAdmin = sessionStorage.getItem('adminUser')
    const adminToken = getToken(ADMIN_TOKEN_KEY)
    setProfilePic('')
    if (savedAdmin && adminToken) {
      try { setAdmin(JSON.parse(savedAdmin)); setUser(null); setEmployer(null) } catch { setAdmin(null) }
    } else if (savedUser && getToken(USER_TOKEN_KEY)) {
      try { setUser(JSON.parse(savedUser)); setEmployer(null) } catch { setUser(null) }
    } else if (savedEmployer && getToken(EMPLOYER_TOKEN_KEY)) {
      try { setEmployer(JSON.parse(savedEmployer)); setUser(null) } catch { setEmployer(null) }
    } else {
      setUser(null); setEmployer(null); setAdmin(null)
    }
  }

  const fetchUserPic = async (email) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/userresume/by-email/${encodeURIComponent(email)}`)
      if (!res.ok) return
      const data = await res.json()
      setProfilePic(data.profilePic || '')
    } catch {
      // Profile image is optional.
    }
  }

  const fetchEmployerPic = async (email) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/by-email/${encodeURIComponent(email)}`)
      if (!res.ok) return
      const data = await res.json()
      setProfilePic(data.profilePic || '')
    } catch {
      // Profile image is optional.
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadAuth, 0)
    window.addEventListener('storage', loadAuth)
    window.addEventListener('profileUpdated', loadAuth)
    window.addEventListener('employerProfileUpdated', loadAuth)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('storage', loadAuth)
      window.removeEventListener('profileUpdated', loadAuth)
      window.removeEventListener('employerProfileUpdated', loadAuth)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadAuth, 0)
    return () => clearTimeout(timer)
  }, [location])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.email) fetchUserPic(user.email)
      else if (employer?.email) fetchEmployerPic(employer.email)
      else setProfilePic('')
    }, 0)
    return () => clearTimeout(timer)
  }, [user, employer])

  useEffect(() => {
    const handler = () => {
      if (user?.email) fetchUserPic(user.email)
      if (employer?.email) fetchEmployerPic(employer.email)
    }
    window.addEventListener('profileUpdated', handler)
    window.addEventListener('employerProfileUpdated', handler)
    return () => {
      window.removeEventListener('profileUpdated', handler)
      window.removeEventListener('employerProfileUpdated', handler)
    }
  }, [user, employer])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openNotifications = async () => {
    setNotificationsOpen((open) => !open)
    setDropdownOpen(false)
    if (!activeTokenKey) return

    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: authHeader(activeTokenKey),
      })
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
      setNotificationCount(0)
      setUnreadMessages(0)
    } catch {
      // Opening the menu should not fail if marking notifications read fails.
    }
  }

  const handleNotificationClick = async (notification) => {
    setNotificationsOpen(false)
    if (activeTokenKey && !notification.read) {
      try {
        await fetch(`${API_BASE_URL}/api/notifications/${notification._id}/read`, {
          method: 'PATCH',
          headers: authHeader(activeTokenKey),
        })
      } catch {
        // Navigation still works if the read update fails.
      }
    }
    navigate(notification.link || (notification.type === 'message' ? '/chat' : '/profile'))
  }

  const handleUserLogout = () => {
    localStorage.removeItem('jobPortalUser')
    removeToken(USER_TOKEN_KEY)
    setUser(null); setProfilePic(''); setDropdownOpen(false)
    setNotifications([]); setNotificationCount(0); setUnreadMessages(0)
    navigate('/login')
  }

  const handleEmployerLogout = () => {
    localStorage.removeItem('employerUser')
    localStorage.removeItem('employerToken')
    setEmployer(null); setProfilePic(''); setDropdownOpen(false)
    setNotifications([]); setNotificationCount(0); setUnreadMessages(0)
    navigate('/login')
  }

  const handleAdminLogout = () => {
    sessionStorage.removeItem('adminUser')
    removeToken(ADMIN_TOKEN_KEY)
    setAdmin(null); setProfilePic(''); setDropdownOpen(false)
    navigate('/admin')
  }

  const isLoggedIn = user || employer || admin
  const displayName = user?.name || employer?.companyName || admin?.username || ''
  const isEmployer = !!employer
  const isAdmin = !!admin

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/jobs', label: 'Jobs' },
    { to: '/aboutus', label: 'About Us' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur px-6 py-4 sm:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-tight text-white">
          Job<span className="text-cyan-400">Portal</span>
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-white transition">{l.label}</Link>
          ))}
          {isEmployer && (
            <Link to="/employer/dashboard" className="text-xs text-violet-400 hover:text-violet-300 transition border border-violet-400/20 rounded-full px-3 py-1">Dashboard</Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              {!isAdmin && (
                <>
                  <div className="relative" ref={notificationsRef}>
                    <button
                      type="button"
                      onClick={openNotifications}
                      className="relative p-2 rounded-full hover:bg-white/10 transition"
                      aria-label="Notifications"
                      title="Notifications"
                    >
                      <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                      </svg>
                      {notificationCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-950">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      )}
                    </button>

                    {notificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl shadow-black/40 z-50">
                        <div className="border-b border-white/10 px-4 py-3">
                          <p className="text-sm font-semibold text-white">Notifications</p>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-slate-400">No notifications yet.</div>
                          ) : notifications.map((notification) => (
                            <button
                              key={notification._id}
                              type="button"
                              onClick={() => handleNotificationClick(notification)}
                              className={`block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/10 ${notification.read ? 'bg-transparent' : 'bg-cyan-500/10'}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${notification.read ? 'bg-slate-600' : 'bg-cyan-400'}`} />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-white">{notification.title}</p>
                                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{notification.body}</p>
                                  <p className="mt-1 text-[11px] text-slate-600">{new Date(notification.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link to="/chat" className="relative p-2 rounded-full hover:bg-white/10 transition" title="Chats" aria-label="Chats">
                    <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {unreadMessages > 0 && (
                      <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                    )}
                  </Link>
                </>
              )}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className={`flex items-center gap-2 rounded-full border bg-white/5 p-1 pr-3 text-sm text-white transition hover:bg-white/10 ${isEmployer ? 'border-violet-400/30 hover:border-violet-400/50' : 'border-white/10 hover:border-cyan-400/40'}`}
                >
                  <div className={`h-8 w-8 rounded-full overflow-hidden border bg-slate-700 flex items-center justify-center flex-shrink-0 ${isEmployer ? 'border-violet-400/30' : 'border-cyan-400/30'}`}>
                    {isAdmin ? (
                      <svg className="h-5 w-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    ) : profilePic ? (
                      <img src={`${API_BASE_URL}/uploads/${profilePic}`} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <svg className="h-5 w-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    )}
                  </div>
                  <span className="max-w-[80px] truncate text-sm">{displayName}</span>
                  <svg className={`h-3 w-3 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900 shadow-xl shadow-black/40 overflow-hidden z-50">

                    {/* User dropdown */}
                    {!isEmployer && !isAdmin && (
                      <>
                        <button onClick={() => { navigate('/profile'); setDropdownOpen(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 transition">
                          <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          View Profile
                        </button>
                        <button onClick={() => { navigate('/profile?edit=true'); setDropdownOpen(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 transition">
                          <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit Profile
                        </button>
                        <button onClick={() => { navigate('/resume-screener'); setDropdownOpen(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 transition">
                          <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                          AI Resume Screener
                        </button>
                      </>
                    )}

                    {/* Employer dropdown */}
                    {isEmployer && (
                      <>
                        <button onClick={() => { navigate('/employer/profile'); setDropdownOpen(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 transition">
                          <svg className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          Company Profile
                        </button>
                        <button onClick={() => { navigate('/employer/profile?edit=true'); setDropdownOpen(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 transition">
                          <svg className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit Profile
                        </button>
                        <button onClick={() => { navigate('/employer/dashboard'); setDropdownOpen(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 transition">
                          <svg className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                          Dashboard
                        </button>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <button onClick={() => { navigate('/admin/panel'); setDropdownOpen(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 transition">
                          <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          Admin Panel
                        </button>
                      </>
                    )}

                    <div className="border-t border-white/10" />
                    <button onClick={isAdmin ? handleAdminLogout : isEmployer ? handleEmployerLogout : handleUserLogout} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-white/10 transition">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-400 transition">
                Login
              </Link>
              <Link to="/admin" className="text-sm font-semibold text-slate-300 hover:text-white">
                Admin
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
