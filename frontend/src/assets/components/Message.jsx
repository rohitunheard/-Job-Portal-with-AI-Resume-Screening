export default function Message({ message, own, profilePic }) {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className={`mb-4 flex gap-2 ${own ? 'justify-end' : 'justify-start'}`}>
      {!own && (
        <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800">
          {profilePic ? <img src={profilePic} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-400">U</span>}
        </div>
      )}
      <div className={`max-w-[78%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
        <p className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg ${
          own
            ? 'rounded-br-md bg-cyan-500 text-white shadow-cyan-950/20'
            : 'rounded-bl-md border border-white/10 bg-white/10 text-slate-100 shadow-black/20'
        }`}>
          {message.text}
        </p>
        {time && <span className="mt-1 text-[11px] text-slate-500">{time}</span>}
      </div>
    </div>
  )
}
