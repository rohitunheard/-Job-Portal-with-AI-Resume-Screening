import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import Conversation from './Conversation'
import Message from './Message'
import { EMPLOYER_TOKEN_KEY, USER_TOKEN_KEY, authHeader, getToken } from '../../utils/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const getStoredIdentity = () => {
  const userToken = getToken(USER_TOKEN_KEY)
  const employerToken = getToken(EMPLOYER_TOKEN_KEY)

  try {
    const savedUser = JSON.parse(localStorage.getItem('jobPortalUser') || 'null')
    if (savedUser && userToken) {
      return {
        currentUser: { ...savedUser, _id: savedUser.id || savedUser._id },
        userType: 'user',
      }
    }
  } catch {
    // Ignore invalid stored auth data and fall through to employer auth.
  }

  try {
    const savedEmployer = JSON.parse(localStorage.getItem('employerUser') || 'null')
    if (savedEmployer && employerToken) {
      return {
        currentUser: { ...savedEmployer, _id: savedEmployer.id || savedEmployer._id },
        userType: 'employer',
      }
    }
  } catch {
    // Ignore invalid stored auth data and treat the visitor as logged out.
  }

  return { currentUser: null, userType: null }
}

const sameId = (a, b) => String(a || '') === String(b || '')

export default function Chat() {
  const [{ currentUser, userType }] = useState(getStoredIdentity)
  const [conversations, setConversations] = useState([])
  const [currentChat, setCurrentChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [error, setError] = useState('')
  const socket = useRef(null)
  const scrollRef = useRef(null)
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const applicationIdToOpen = useMemo(() => {
    return searchParams.get('applicationId') ||
      location.state?.applicationId ||
      location.state?.conversation?.applicationId ||
      location.state?.conversation?.application?._id ||
      ''
  }, [location.state, searchParams])

  const tokenKey = userType === 'employer' ? EMPLOYER_TOKEN_KEY : USER_TOKEN_KEY
  const activeOtherUser = currentChat?.otherMember

  useEffect(() => {
    if (!currentUser?._id || !userType) return

    socket.current = io(API_BASE_URL)
    socket.current.emit('addUser', { userId: currentUser._id, role: userType })

    const handleIncoming = (message) => {
      if (!message?.conversationId) return

      setConversations((current) => current.map((conversation) =>
        sameId(conversation._id, message.conversationId)
          ? { ...conversation, lastMessage: message.text, lastMessageAt: message.createdAt }
          : conversation
      ))

      setMessages((current) => {
        if (!sameId(currentChat?._id, message.conversationId)) return current
        if (message._id && current.some((item) => sameId(item._id, message._id))) return current
        return [...current, message]
      })
    }

    socket.current.on('message:new', handleIncoming)
    socket.current.on('getMessage', handleIncoming)

    return () => {
      socket.current?.off('message:new', handleIncoming)
      socket.current?.off('getMessage', handleIncoming)
      socket.current?.disconnect()
    }
  }, [currentUser?._id, userType, currentChat?._id])

  useEffect(() => {
    if (!currentUser?._id || !userType) return

    let ignore = false
    const loadConversations = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE_URL}/api/conversations`, {
          headers: authHeader(tokenKey),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Could not load chats')
        if (ignore) return

        const list = Array.isArray(data) ? data : []
        setConversations(list)

        if (!applicationIdToOpen && list.length > 0) {
          setCurrentChat((selected) => selected || list[0])
        }
      } catch (err) {
        if (!ignore) setError(err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadConversations()
    return () => { ignore = true }
  }, [applicationIdToOpen, currentUser?._id, userType, tokenKey])

  useEffect(() => {
    if (!applicationIdToOpen || !currentUser?._id || !userType) return

    let ignore = false
    const openApplicationChat = async () => {
      setError('')
      try {
        const res = await fetch(`${API_BASE_URL}/api/conversations/application/${applicationIdToOpen}`, {
          headers: authHeader(tokenKey),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Could not open this chat')
        if (ignore) return

        setCurrentChat(data)
        setConversations((current) => {
          const withoutDuplicate = current.filter((conversation) => !sameId(conversation._id, data._id))
          return [data, ...withoutDuplicate]
        })
      } catch (err) {
        if (!ignore) setError(err.message)
      }
    }

    openApplicationChat()
    return () => { ignore = true }
  }, [applicationIdToOpen, currentUser?._id, userType, tokenKey])

  useEffect(() => {
    if (!currentChat?._id || !userType) return

    let ignore = false
    const loadMessages = async () => {
      setMessagesLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE_URL}/api/messages/${currentChat._id}`, {
          headers: authHeader(tokenKey),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Could not load messages')
        if (!ignore) setMessages(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!ignore) setError(err.message)
      } finally {
        if (!ignore) setMessagesLoading(false)
      }
    }

    loadMessages()
    return () => { ignore = true }
  }, [currentChat?._id, userType, tokenKey])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const text = newMessage.trim()
    if (!text || !currentChat?._id) return

    setNewMessage('')
    setError('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(tokenKey),
        },
        body: JSON.stringify({
          conversationId: currentChat._id,
          text,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not send message')

      setMessages((current) => [...current, data])
      setConversations((current) => current.map((conversation) =>
        sameId(conversation._id, currentChat._id)
          ? { ...conversation, lastMessage: data.text, lastMessageAt: data.createdAt }
          : conversation
      ))
    } catch (err) {
      setNewMessage(text)
      setError(err.message)
    }
  }

  const getProfilePic = (senderId) => {
    if (sameId(senderId, currentUser?._id)) {
      return currentUser?.profilePic ? `${API_BASE_URL}/uploads/${currentUser.profilePic}` : ''
    }

    return activeOtherUser?.profilePic ? `${API_BASE_URL}/uploads/${activeOtherUser.profilePic}` : ''
  }

  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-70px)] bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-2xl font-semibold">Log in to view chats</h1>
          <p className="mt-2 text-sm text-slate-400">Your shortlisted application messages appear here.</p>
          <Link to="/login" className="mt-6 inline-flex rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-400">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-70px)] bg-slate-950 px-4 py-6 text-white sm:px-8">
      <div className="mx-auto grid h-[calc(100vh-120px)] max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/20 lg:grid-cols-[360px_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-white/10 bg-slate-900/70 lg:border-b-0 lg:border-r">
          <div className="border-b border-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Messages</p>
            <h1 className="mt-2 text-2xl font-semibold">Application Chats</h1>
          </div>

          {error && (
            <div className="m-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="p-4 text-sm text-slate-400">Loading chats...</div>
            ) : conversations.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
                No shortlisted chats yet.
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => setCurrentChat(conversation)}
                  className={`mb-2 w-full rounded-xl text-left transition ${
                    sameId(currentChat?._id, conversation._id)
                      ? 'bg-cyan-500/15 ring-1 ring-cyan-400/30'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <Conversation conversation={conversation} />
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-slate-950/40">
          {currentChat ? (
            <>
              <header className="border-b border-white/10 bg-slate-900/50 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-white">{activeOtherUser?.name || 'Employer'}</p>
                    <p className="truncate text-sm text-cyan-200">
                      {currentChat.application?.jobTitle || currentChat.jobTitle} · {currentChat.application?.company || currentChat.company}
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Shortlisted
                  </span>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                {messagesLoading ? (
                  <div className="text-sm text-slate-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Start the conversation for this role.
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message._id || `${message.sender}-${message.createdAt}`} ref={scrollRef}>
                      <Message
                        message={message}
                        own={sameId(message.sender, currentUser._id)}
                        profilePic={getProfilePic(message.sender)}
                      />
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSubmit} className="border-t border-white/10 bg-slate-900/60 p-4">
                <div className="flex items-end gap-3">
                  <textarea
                    className="max-h-32 min-h-12 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                    placeholder="Write a message..."
                    onChange={(event) => setNewMessage(event.target.value)}
                    value={newMessage}
                    rows={1}
                  />
                  <button
                    className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!newMessage.trim()}
                    type="submit"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">
              Select a shortlisted application chat.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
