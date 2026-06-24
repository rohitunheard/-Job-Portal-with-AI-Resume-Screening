const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Conversation({ conversation }) {
  const friend = conversation.otherMember
  const profilePicUrl = friend?.profilePic ? `${API_BASE_URL}/uploads/${friend.profilePic}` : ''
  const title = conversation.application?.jobTitle || conversation.jobTitle || 'Shortlisted role'
  const company = conversation.application?.company || conversation.company || ''
  const preview = conversation.lastMessage || 'No messages yet'

  return (
    <div className="flex items-start gap-3 p-3">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/20 bg-slate-800">
        {profilePicUrl ? (
          <img className="h-full w-full object-cover" src={profilePicUrl} alt={friend?.name || 'Profile'} />
        ) : (
          <span className="text-sm font-semibold text-cyan-200">{(friend?.name || '?').charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white">{friend?.name || 'Loading...'}</p>
          <span className="flex-shrink-0 text-[11px] text-slate-500">{formatDate(conversation.lastMessageAt || conversation.updatedAt)}</span>
        </div>
        <p className="mt-0.5 truncate text-xs font-medium text-cyan-200">{title}</p>
        <p className="truncate text-xs text-slate-400">{company}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{preview}</p>
      </div>
    </div>
  )
}
