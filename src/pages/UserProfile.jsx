// src/pages/UserProfile.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'
import Navbar from '../components/Navbar'

export default function UserProfile() {
  const { userId }  = useParams()     // URL se userId lo: /user/:userId
  const { user }    = useAuth()
  const navigate    = useNavigate()

  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    // Agar apni hi profile pe click kiya toh /profile pe bhejo
    if (userId === user?._id) {
      navigate('/profile')
      return
    }

    const fetchUser = async () => {
      try {
        const res = await API.get(`/auth/user/${userId}`)
        const data = res.data.user || res.data
        setProfile(data)
        // Check kar ki already follow kar rahe ho ya nahi
        const followers = data.followers || []
        setFollowing(followers.includes(user?._id))
      } catch (err) {
        console.error('User fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [userId])

  const handleFollow = async () => {
    await API.put(`/auth/follow/${userId}`)
    setFollowing(!following)
    setProfile(prev => {
      const followers = prev.followers || []
      return {
        ...prev,
        followers: following
          ? followers.filter(id => id !== user?._id)
          : [...followers, user?._id]
      }
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="text-center text-gray-500 py-24">Loading profile...</div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="text-center text-red-400 py-24">User not found.</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

          {/* Avatar + name + follow button */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile.name?.[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{profile.name}</h1>
              <p className="text-gray-400 text-sm">{profile.email}</p>
              {profile.githubUsername && (
                <a
                  href={`https://github.com/${profile.githubUsername}`}
                  target="_blank" rel="noreferrer"
                  className="text-blue-400 text-xs hover:underline"
                >
                  @{profile.githubUsername}
                </a>
              )}
            </div>

            {/* Follow / Unfollow button */}
            <button
              onClick={handleFollow}
              className={`text-sm font-medium px-5 py-2 rounded-xl border transition-colors ${
                following
                  ? 'border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400'
                  : 'border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white'
              }`}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Bio</label>
              <p className="text-gray-300 text-sm mt-1">{profile.bio}</p>
            </div>
          )}

          {/* Location */}
          {profile.location && (
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Location</label>
              <p className="text-gray-300 text-sm mt-1">📍 {profile.location}</p>
            </div>
          )}

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Skills</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.skills.map(s => (
                  <span key={s} className="text-xs bg-blue-900/40 text-blue-400 px-2 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-6 text-center border-t border-gray-800 pt-4">
            {[
              { label: 'Followers', val: profile.followers?.length || 0 },
              { label: 'Following', val: profile.following?.length || 0 },
              { label: 'Repos',     val: profile.githubRepos?.length || 0 },
            ].map(s => (
              <div key={s.label}>
                <div className="text-white font-bold text-lg">{s.val}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* GitHub Repos */}
        {profile.githubRepos?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">GitHub Repositories</h2>
            <div className="space-y-3">
              {profile.githubRepos.slice(0, 6).map(repo => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <div className="text-blue-400 text-sm font-medium">{repo.name}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{repo.description || 'No description'}</div>
                  </div>
                  <div className="text-gray-500 text-xs">⭐ {repo.stargazers_count}</div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}