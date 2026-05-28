// src/pages/Chat.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import API from '../api/axios'
import Navbar from '../components/Navbar'

// ─── Icons (inline SVG — no extra dependency) ────────────────────────────────
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const PaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
)
const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)
const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const DoubleCheckIcon = () => (
  <svg width="16" height="12" viewBox="0 0 28 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2 7 7 12 14 4"/><polyline points="10 7 15 12 26 2"/>
  </svg>
)
const EmojiIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const groupMessagesByDate = (messages) => {
  const groups = []
  let currentDate = null
  messages.forEach(msg => {
    const msgDate = formatDate(msg.createdAt)
    if (msgDate !== currentDate) {
      groups.push({ type: 'date', label: msgDate })
      currentDate = msgDate
    }
    groups.push({ type: 'message', data: msg })
  })
  return groups
}

const isImageFile = (filename) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename || '')
const getFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const EMOJI_REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🔥']

// ─── Component: Typing Indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start px-1">
      <div style={{
        background: 'var(--bubble-other)',
        borderRadius: '18px 18px 18px 4px',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: '4px'
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: '7px', height: '7px',
            borderRadius: '50%',
            background: 'var(--text-muted)',
            display: 'inline-block',
            animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`
          }}/>
        ))}
      </div>
    </div>
  )
}

// ─── Component: Attachment Preview (before send) ─────────────────────────────
function AttachmentPreview({ files, onRemove }) {
  if (!files.length) return null
  return (
    <div style={{
      padding: '10px 16px 0',
      display: 'flex', flexWrap: 'wrap', gap: '8px'
    }}>
      {files.map((f, i) => (
        <div key={i} style={{
          position: 'relative',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1.5px solid var(--border)',
          background: 'var(--bg-tertiary)',
          flexShrink: 0
        }}>
          {isImageFile(f.name) ? (
            <img
              src={URL.createObjectURL(f)}
              alt={f.name}
              style={{ width: '80px', height: '80px', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '80px', height: '80px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '4px',
              padding: '8px'
            }}>
              <FileIcon />
              <span style={{
                fontSize: '10px', color: 'var(--text-muted)',
                textAlign: 'center', wordBreak: 'break-all',
                lineHeight: '1.2',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>{f.name}</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{getFileSize(f.size)}</span>
            </div>
          )}
          <button
            onClick={() => onRemove(i)}
            style={{
              position: 'absolute', top: '4px', right: '4px',
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.7)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', padding: 0
            }}
          >
            <XIcon size={10} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Component: Image Lightbox ────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease'
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '20px', right: '20px',
          background: 'rgba(255,255,255,0.1)', border: 'none',
          borderRadius: '50%', width: '40px', height: '40px',
          cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <XIcon size={18} />
      </button>
      <img
        src={src}
        alt="preview"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '90vh',
          objectFit: 'contain', borderRadius: '8px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          animation: 'zoomIn 0.2s ease'
        }}
      />
    </div>
  )
}

// ─── Component: Message Bubble ────────────────────────────────────────────────
function MessageBubble({ msg, isMine, onReact, onImageClick }) {
  const [showReactions, setShowReactions] = useState(false)
  const hasAttachments = msg.attachments?.length > 0
  const textOnly = !hasAttachments && msg.text

  return (
    <div
      className={`msg-row ${isMine ? 'mine' : 'theirs'}`}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
      style={{
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: '6px',
        padding: '2px 0',
        position: 'relative'
      }}
    >
      {/* Reaction picker */}
      {showReactions && (
        <div style={{
          position: 'absolute',
          top: '-38px',
          [isMine ? 'right' : 'left']: '0',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '4px 8px',
          display: 'flex', gap: '4px',
          zIndex: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          animation: 'popIn 0.15s ease'
        }}>
          {EMOJI_REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => onReact(msg._id || msg.createdAt, emoji)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '18px', padding: '2px', borderRadius: '6px',
                transition: 'transform 0.1s',
                lineHeight: 1
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.3)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div style={{ maxWidth: '68%' }}>
        {/* Attachments */}
        {hasAttachments && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '4px',
            marginBottom: msg.text ? '6px' : '0',
            alignItems: isMine ? 'flex-end' : 'flex-start'
          }}>
            {msg.attachments.map((att, i) => (
              isImageFile(att.name || att.url) ? (
                <div
                  key={i}
                  onClick={() => onImageClick(att.url)}
                  style={{
                    borderRadius: '12px', overflow: 'hidden',
                    cursor: 'pointer', maxWidth: '280px',
                    border: '1px solid var(--border)',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <img
                    src={att.url}
                    alt={att.name}
                    style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : (
                <a
                  key={i}
                  href={att.url}
                  download={att.name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px',
                    background: isMine ? 'rgba(255,255,255,0.15)' : 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    minWidth: '200px', maxWidth: '280px',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isMine ? 'rgba(255,255,255,0.22)' : 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = isMine ? 'rgba(255,255,255,0.15)' : 'var(--bg-tertiary)'}
                >
                  <div style={{ color: isMine ? 'rgba(255,255,255,0.8)' : 'var(--accent)', flexShrink: 0 }}>
                    <FileIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 500,
                      color: isMine ? '#fff' : 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>{att.name}</div>
                    <div style={{ fontSize: '11px', color: isMine ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                      {getFileSize(att.size)}
                    </div>
                  </div>
                  <div style={{ color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', flexShrink: 0 }}>
                    <DownloadIcon />
                  </div>
                </a>
              )
            ))}
          </div>
        )}

        {/* Text bubble */}
        {msg.text && (
          <div style={{
            background: isMine ? 'var(--bubble-mine)' : 'var(--bubble-other)',
            color: isMine ? '#fff' : 'var(--text-primary)',
            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            padding: '10px 14px',
            fontSize: '14px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            {msg.text}
          </div>
        )}

        {/* Timestamp + status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          marginTop: '3px', padding: '0 4px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {formatTime(msg.createdAt)}
          </span>
          {isMine && (
            <span style={{ color: msg.seen ? 'var(--accent)' : 'var(--text-muted)' }}>
              {msg.seen ? <DoubleCheckIcon /> : <CheckIcon />}
            </span>
          )}
        </div>

        {/* Reactions display */}
        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '4px',
            justifyContent: isMine ? 'flex-end' : 'flex-start',
            marginTop: '4px'
          }}>
            {Object.entries(msg.reactions).map(([emoji, count]) => (
              <span key={emoji} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px', padding: '2px 7px',
                fontSize: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '3px'
              }}>
                {emoji} <span style={{ color: 'var(--text-muted)' }}>{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user } = useAuth()
  const { socket } = useSocket()

  const [users, setUsers]               = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [activeUser, setActiveUser]     = useState(null)
  const [messages, setMessages]         = useState([])
  const [text, setText]                 = useState('')
  const [attachments, setAttachments]   = useState([])   // File[] — pending upload
  const [isTyping, setIsTyping]         = useState(false) // other user typing
  const [lightboxSrc, setLightboxSrc]   = useState(null)
  const [search, setSearch]             = useState('')
  const [uploading, setUploading]       = useState(false)
  const [onlineUsers, setOnlineUsers]   = useState(new Set())

  const bottomRef      = useRef(null)
  const fileInputRef   = useRef(null)
  const imageInputRef  = useRef(null)
  const typingTimeout  = useRef(null)
  const inputRef       = useRef(null)

  // ── Fetch users ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    API.get('/auth/explore').then(res => {
      const all = res.data.users || res.data || []
      const list = Array.isArray(all) ? all : []
      const filtered = list.filter(u => u._id !== user._id)
      setUsers(filtered)
      setFilteredUsers(filtered)
    }).catch(() => { setUsers([]); setFilteredUsers([]) })
  }, [user])

  // ── Search filter ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setFilteredUsers(users); return }
    setFilteredUsers(users.filter(u =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    ))
  }, [search, users])

  // ── Load history ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setMessages([])
    if (!activeUser) return
    API.get(`/chat/${activeUser._id}`)
      .then(res => {
        const msgs = res.data.messages || []
        setMessages(Array.isArray(msgs) ? msgs : [])
      })
      .catch(() => setMessages([]))
  }, [activeUser])

  // ── Socket events ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const handleReceive = (newMsg) => {
      const senderId = newMsg.sender?.toString() || newMsg.senderId?.toString()
      if (senderId === activeUser?._id?.toString()) {
        setMessages(prev => [...prev, newMsg])
        // Mark as seen
        socket.emit('messageSeen', { msgId: newMsg._id, to: senderId })
      }
    }

    const handleTyping = ({ from }) => {
      if (from === activeUser?._id) {
        setIsTyping(true)
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => setIsTyping(false), 2500)
      }
    }

    const handleSeen = ({ msgId }) => {
      setMessages(prev =>
        prev.map(m => (m._id === msgId ? { ...m, seen: true } : m))
      )
    }

    const handleOnlineUsers = (ids) => setOnlineUsers(new Set(ids))

    socket.on('receiveMessage', handleReceive)
    socket.on('typing', handleTyping)
    socket.on('messageSeen', handleSeen)
    socket.on('onlineUsers', handleOnlineUsers)

    return () => {
      socket.off('receiveMessage', handleReceive)
      socket.off('typing', handleTyping)
      socket.off('messageSeen', handleSeen)
      socket.off('onlineUsers', handleOnlineUsers)
    }
  }, [socket, activeUser])

  // ── Auto-scroll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Typing emit ───────────────────────────────────────────────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value)
    if (socket && activeUser) {
      socket.emit('typing', { to: activeUser._id, from: user._id })
    }
  }

  // ── File select ───────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files].slice(0, 5)) // max 5
    e.target.value = ''
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // ── Send message ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (e) => {
    e?.preventDefault()
    if ((!text.trim() && !attachments.length) || !activeUser || !user) return

    let uploadedAttachments = []

    // Upload files if any
    if (attachments.length > 0) {
      setUploading(true)
      try {
        const formData = new FormData()
        attachments.forEach(f => formData.append('files', f))
        const res = await API.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        uploadedAttachments = res.data.files || []
      } catch (err) {
        console.error('Upload error:', err)
        // If no upload endpoint yet — use object URLs as fallback (dev only)
        uploadedAttachments = attachments.map(f => ({
          name: f.name,
          url: URL.createObjectURL(f),
          size: f.size,
          type: f.type
        }))
      } finally {
        setUploading(false)
      }
    }

    const optimisticMsg = {
      sender: user._id,
      receiver: activeUser._id,
      text: text.trim(),
      attachments: uploadedAttachments,
      createdAt: new Date(),
      seen: false,
      _optimistic: true
    }

    setMessages(prev => [...prev, optimisticMsg])
    setText('')
    setAttachments([])

    try {
      const { data } = await API.post('/chat/send', {
        receiverId: activeUser._id,
        text: optimisticMsg.text,
        attachments: uploadedAttachments
      })

      // Replace optimistic with real message
      setMessages(prev =>
        prev.map(m => m._optimistic && m.createdAt === optimisticMsg.createdAt
          ? { ...data.message, seen: false }
          : m
        )
      )

      socket?.emit('sendMessage', {
        ...data.message,
        receiverId: activeUser._id
      })
    } catch (err) {
      console.error('Send error:', err)
      setMessages(prev => prev.filter(m => m !== optimisticMsg))
    }
  }, [text, attachments, activeUser, user, socket])

  // ── Keyboard shortcut: Enter to send ─────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Reactions ─────────────────────────────────────────────────────────────────
  const handleReact = (msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      const key = m._id || m.createdAt
      if (key !== msgId) return m
      const reactions = { ...(m.reactions || {}) }
      reactions[emoji] = (reactions[emoji] || 0) + 1
      return { ...m, reactions }
    }))
    socket?.emit('reaction', { msgId, emoji, to: activeUser._id })
  }

  const grouped = groupMessagesByDate(messages)
  const isOnline = activeUser && onlineUsers.has(activeUser._id)

  return (
    <>
      <style>{`
        :root {
          --accent: #3b82f6;
          --accent-hover: #2563eb;
          --bubble-mine: #3b82f6;
          --bubble-other: #1f2937;
          --bg-primary: #030712;
          --bg-secondary: #111827;
          --bg-tertiary: #1f2937;
          --bg-hover: #374151;
          --text-primary: #f9fafb;
          --text-secondary: #9ca3af;
          --text-muted: #6b7280;
          --border: rgba(255,255,255,0.08);
          --border-strong: rgba(255,255,255,0.14);
          --online: #22c55e;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        @keyframes popIn {
          from { transform: scale(0.85) translateY(4px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);   opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }

        .chat-layout {
          min-height: 100vh;
          background: var(--bg-primary);
          display: flex;
          flex-direction: column;
        }

        .chat-body {
          display: flex;
          flex: 1;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          padding: 16px;
          gap: 12px;
          height: calc(100vh - 64px);
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 280px;
          flex-shrink: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 18px 16px 12px;
          border-bottom: 1px solid var(--border);
        }

        .sidebar-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 8px 12px;
        }

        .search-box input {
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 13px;
          width: 100%;
        }

        .search-box input::placeholder { color: var(--text-muted); }

        .user-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          scrollbar-width: thin;
          scrollbar-color: var(--bg-hover) transparent;
        }

        .user-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border-radius: 12px;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          transition: background 0.15s;
          position: relative;
        }

        .user-item:hover { background: var(--bg-tertiary); }
        .user-item.active { background: rgba(59,130,246,0.15); }

        .avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 15px;
          flex-shrink: 0;
          position: relative;
        }

        .avatar-sm {
          width: 34px; height: 34px;
          font-size: 13px;
        }

        .online-dot {
          position: absolute;
          bottom: 1px; right: 1px;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: var(--online);
          border: 2px solid var(--bg-secondary);
        }

        .user-info { flex: 1; min-width: 0; }
        .user-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .user-status { font-size: 11px; color: var(--text-muted); }
        .user-item.active .user-name { color: #93c5fd; }

        /* ── Chat panel ── */
        .chat-panel {
          flex: 1;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .chat-header {
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-secondary);
          flex-shrink: 0;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          scrollbar-width: thin;
          scrollbar-color: var(--bg-hover) transparent;
        }

        .date-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0 8px;
        }
        .date-divider::before,
        .date-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .date-label {
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
          padding: 3px 10px;
          background: var(--bg-tertiary);
          border-radius: 10px;
          border: 1px solid var(--border);
        }

        /* ── Input area ── */
        .input-area {
          border-top: 1px solid var(--border);
          background: var(--bg-secondary);
          flex-shrink: 0;
        }

        .input-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 12px 14px;
        }

        .input-box {
          flex: 1;
          display: flex;
          align-items: flex-end;
          gap: 6px;
          background: var(--bg-tertiary);
          border: 1.5px solid var(--border-strong);
          border-radius: 16px;
          padding: 8px 8px 8px 14px;
          transition: border-color 0.2s;
        }

        .input-box:focus-within {
          border-color: var(--accent);
        }

        .input-box textarea {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.5;
          resize: none;
          max-height: 120px;
          min-height: 22px;
          font-family: inherit;
          padding: 2px 0;
          scrollbar-width: thin;
        }

        .input-box textarea::placeholder { color: var(--text-muted); }

        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 5px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          transition: color 0.15s, background 0.15s;
          flex-shrink: 0;
        }

        .icon-btn:hover { color: var(--text-primary); background: var(--bg-hover); }

        .send-btn {
          width: 42px; height: 42px;
          border-radius: 14px;
          background: var(--accent);
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
          transition: background 0.15s, transform 0.1s;
        }

        .send-btn:hover { background: var(--accent-hover); }
        .send-btn:active { transform: scale(0.94); }
        .send-btn:disabled { background: var(--bg-hover); cursor: not-allowed; }

        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          gap: 12px;
        }

        .empty-icon {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
        }

        .uploading-bar {
          height: 2px;
          background: linear-gradient(90deg, var(--accent), #8b5cf6, var(--accent));
          background-size: 200% 100%;
          animation: shimmer 1.2s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      <div className="chat-layout">
        <Navbar />

        <div className="chat-body">
          {/* ── Sidebar ── */}
          <div className="sidebar">
            <div className="sidebar-header">
              <div className="sidebar-title">Messages</div>
              <div className="search-box">
                <SearchIcon />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                />
              </div>
            </div>

            <div className="user-list">
              {filteredUsers.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 8px' }}>
                  No users found
                </p>
              )}
              {filteredUsers.map(u => (
                <button
                  key={u._id}
                  onClick={() => { setActiveUser(u); inputRef.current?.focus() }}
                  className={`user-item ${activeUser?._id === u._id ? 'active' : ''}`}
                >
                  <div className="avatar avatar-sm">
                    {u.name?.[0]?.toUpperCase()}
                    {onlineUsers.has(u._id) && <span className="online-dot" />}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{u.name}</div>
                    <div className="user-status">
                      {onlineUsers.has(u._id) ? '● Online' : 'Offline'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Chat Panel ── */}
          <div className="chat-panel">
            {activeUser ? (
              <>
                {/* Header */}
                <div className="chat-header">
                  <div className="avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
                    {activeUser.name?.[0]?.toUpperCase()}
                    {isOnline && <span className="online-dot" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {activeUser.name}
                    </div>
                    <div style={{ fontSize: '12px', color: isOnline ? 'var(--online)' : 'var(--text-muted)' }}>
                      {isTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>

                {/* Uploading bar */}
                {uploading && <div className="uploading-bar" />}

                {/* Messages */}
                <div className="messages-area">
                  {messages.length === 0 && !isTyping && (
                    <div style={{
                      textAlign: 'center', color: 'var(--text-muted)',
                      fontSize: '14px', paddingTop: '40px'
                    }}>
                      No messages yet. Say hi 👋
                    </div>
                  )}

                  {grouped.map((item, i) => {
                    if (item.type === 'date') {
                      return (
                        <div key={`date-${i}`} className="date-divider">
                          <span className="date-label">{item.label}</span>
                        </div>
                      )
                    }

                    const msg = item.data
                    const senderId = msg.sender?._id?.toString()
                      ?? msg.sender?.toString()
                      ?? msg.senderId?.toString()
                    const isMine = senderId === user?._id?.toString()

                    return (
                      <MessageBubble
                        key={msg._id || i}
                        msg={msg}
                        isMine={isMine}
                        onReact={handleReact}
                        onImageClick={setLightboxSrc}
                      />
                    )
                  })}

                  {isTyping && <TypingIndicator />}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="input-area">
                  <AttachmentPreview files={attachments} onRemove={removeAttachment} />

                  {/* Hidden file inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="*/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />

                  <div className="input-row">
                    <div className="input-box">
                      <textarea
                        ref={inputRef}
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${activeUser.name}...`}
                        rows={1}
                        onInput={e => {
                          e.target.style.height = 'auto'
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                        }}
                      />
                      <button
                        className="icon-btn"
                        onClick={() => imageInputRef.current?.click()}
                        title="Send image"
                      >
                        <ImageIcon />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach file"
                      >
                        <PaperclipIcon />
                      </button>
                    </div>

                    <button
                      className="send-btn"
                      onClick={sendMessage}
                      disabled={uploading || (!text.trim() && !attachments.length)}
                      title="Send (Enter)"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Your Messages
                </div>
                <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: '200px' }}>
                  Select a conversation to start chatting
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}