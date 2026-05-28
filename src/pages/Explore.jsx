// src/pages/Explore.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'
import Navbar from '../components/Navbar'

export default function ExplorePage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [users, setUsers]     = useState([])
  const [search, setSearch]   = useState('')
  const [skill, setSkill]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const params = {}
        if (search) params.search = search
        if (skill)  params.skill  = skill
        const res = await API.get('/auth/explore', { params })
        const all = res.data.users || res.data || []
        setUsers(Array.isArray(all) ? all : [])
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    const timer = setTimeout(fetchUsers, 400)
    return () => clearTimeout(timer)
  }, [search, skill])

  const handleFollow = async (e, targetId) => {
    e.stopPropagation()   // ✅ card click se rok — sirf follow button kaam kare
    await API.put(`/auth/follow/${targetId}`)
    setUsers(users.map(u => {
      if (u._id !== targetId) return u
      const followers = u.followers || []
      const isFollowing = followers.includes(user?._id)
      return {
        ...u,
        followers: isFollowing
          ? followers.filter(id => id !== user?._id)
          : [...followers, user?._id]
      }
    }))
  }

  const goToProfile = (userId) => {
    if (userId === user?._id) {
      navigate('/profile')
    } else {
      navigate(`/user/${userId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold text-white mb-6">Explore Developers</h1>

        <div className="flex gap-3 mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
          />
          <input
            value={skill}
            onChange={e => setSkill(e.target.value)}
            placeholder="Filter by skill..."
            className="w-40 bg-gray-800 text-white rounded-xl px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Searching...</div>
        ) : (
          <div className="space-y-3">
            {users.filter(u => u._id !== user?._id).map(u => {
              const followers   = u.followers || []
              const isFollowing = followers.includes(user?._id)
              return (
                <div
                  key={u._id}
                  onClick={() => goToProfile(u._id)}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-gray-600 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {u.name?.[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm hover:text-blue-400 transition-colors">
                      {u.name}
                    </div>
                    <div className="text-gray-500 text-xs truncate">{u.bio || 'No bio'}</div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {u.skills?.slice(0, 3).map(s => (
                        <span key={s} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Follow button */}
                  <button
                    onClick={(e) => handleFollow(e, u._id)}
                    className={`text-sm font-medium px-4 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${
                      isFollowing
                        ? 'border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400'
                        : 'border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              )
            })}
            {!loading && users.filter(u => u._id !== user?._id).length === 0 && (
              <div className="text-center text-gray-500 py-12">No developers found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}