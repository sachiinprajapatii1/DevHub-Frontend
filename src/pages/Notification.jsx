// src/pages/NotificationsPage.jsx
import { useState, useEffect } from 'react'
import API from '../api/axios'
import Navbar from '../components/Navbar'

const TYPE_CONFIG = {
  like:    { icon: '❤️', color: 'text-red-400',   label: 'liked your post' },
  comment: { icon: '💬', color: 'text-blue-400',  label: 'commented on your post' },
  follow:  { icon: '👤', color: 'text-green-400', label: 'started following you' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/notification')
        const data = res.data.notifications || res.data || []
        setNotifications(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const markAsRead = async (id) => {
    await API.put(`/notification/${id}`)
    setNotifications(notifications.map(n =>
      n._id === id ? { ...n, read: true } : n
    ))
  }

  const markAllRead = async () => {
    // Mark all one by one
    const unread = notifications.filter(n => !n.read)
    await Promise.all(unread.map(n => API.put(`/notification/${n._id}`)))
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-gray-400 text-sm mt-0.5">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔔</div>
            <div className="text-gray-500">No notifications yet</div>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const config = TYPE_CONFIG[n.type] || { icon:'🔔', color:'text-gray-400', label: n.type }
              return (
                <div
                  key={n._id}
                  onClick={() => !n.read && markAsRead(n._id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors cursor-pointer ${
                    n.read
                      ? 'bg-gray-900 border-gray-800'
                      : 'bg-gray-900 border-blue-800/50 hover:border-blue-600/50'
                  }`}
                >
                  {/* Unread dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg">
                      {config.icon}
                    </div>
                    {!n.read && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-gray-950" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">
                      <span className={`font-semibold ${config.color}`}>
                        {n.sender?.name || 'Someone'}
                      </span>
                      {' '}{config.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString('en-IN', {
                        day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'
                      })}
                    </p>
                  </div>

                  {/* Unread label */}
                  {!n.read && (
                    <span className="text-xs text-blue-400 font-medium flex-shrink-0">New</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}