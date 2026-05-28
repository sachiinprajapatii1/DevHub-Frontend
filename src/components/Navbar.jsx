// src/components/Navbar.jsx — updated with badge
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

export default function Navbar() {
  const { user, logout }     = useAuth()
  const navigate             = useNavigate()
  const [unread, setUnread]  = useState(0)

  useEffect(() => {
    if (!user) return
    API.get('/notification')
      .then(res => {
        const data = res.data.notifications || res.data || []
        const list = Array.isArray(data) ? data : []
        setUnread(list.filter(n => !n.read).length)
      })
      .catch(() => {})  // silently fail — navbar shouldn't crash
  }, [user])

  const handleLogout = async () => {
    try { await API.get('/auth/logout') } catch {}
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link to="/feed" className="text-white font-bold text-lg">
        <span className="text-blue-400"></span> DevHub
      </Link>

      <div className="flex items-center gap-6 text-sm">
        <Link to="/feed"    className="text-gray-400 hover:text-white transition-colors">Feed</Link>
        <Link to="/explore" className="text-gray-400 hover:text-white transition-colors">Explore</Link>
        <Link to="/chat"    className="text-gray-400 hover:text-white transition-colors">💬</Link>

        {/* Bell with badge */}
        <Link to="/notification" className="relative text-gray-400 hover:text-white transition-colors">
          🔔
          {unread > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        <Link to="/profile" className="text-gray-400 hover:text-white transition-colors font-medium">
          {user?.name?.split(' ')[0]}
        </Link>
        <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition-colors">
          Logout
        </button>
      </div>
    </nav>
  )
}
