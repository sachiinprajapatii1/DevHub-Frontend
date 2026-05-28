// src/pages/Profile.jsx
import { useState, useEffect } from 'react'
import API from '../api/axios'
import Navbar from '../components/Navbar'

export default function ProfilePage() {
  const [profile, setProfile]     = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm]           = useState({})
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/auth/profile')
        const userData = res.data.user || res.data
        const repos    = res.data.repos || []
        setProfile({ ...userData, githubRepos: repos })
        setForm({
          bio:            userData.bio                  || '',
          skills:         userData.skills?.join(', ')   || '',
          location:       userData.location             || '',
          githubUsername: userData.githubUsername       || '',
        })
      } catch (err) {
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const skillsArray = form.skills.split(',').map(s => s.trim()).filter(Boolean)
      const res = await API.post('/auth/profile', { ...form, skills: skillsArray })
      const userData = res.data.user || res.data
      const repos    = res.data.repos || profile.githubRepos || []
      setProfile({ ...userData, githubRepos: repos })
      setIsEditing(false)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
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
      <div className="text-center text-red-400 py-24">Could not load profile.</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile.name?.[0]}
            </div>
            <div>
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
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="ml-auto text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Bio</label>
            {isEditing ? (
              <textarea
                value={form.bio}
                onChange={e => setForm({...form, bio: e.target.value})}
                rows={3}
                className="w-full mt-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
              />
            ) : (
              <p className="text-gray-300 text-sm mt-1">{profile.bio || 'No bio yet.'}</p>
            )}
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Location</label>
            {isEditing ? (
              <input
                value={form.location}
                onChange={e => setForm({...form, location: e.target.value})}
                className="w-full mt-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Noida, India"
              />
            ) : (
              <p className="text-gray-300 text-sm mt-1">{profile.location || '—'}</p>
            )}
          </div>

          {/* Skills */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Skills</label>
            {isEditing ? (
              <input
                value={form.skills}
                onChange={e => setForm({...form, skills: e.target.value})}
                className="w-full mt-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500"
                placeholder="react, node, mongodb"
              />
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.skills?.length
                  ? profile.skills.map(s => (
                      <span key={s} className="text-xs bg-blue-900/40 text-blue-400 px-2 py-1 rounded-full">{s}</span>
                    ))
                  : <span className="text-gray-500 text-sm">No skills added yet.</span>
                }
              </div>
            )}
          </div>

          {/* GitHub Username */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase tracking-wide">GitHub Username</label>
            {isEditing ? (
              <input
                value={form.githubUsername}
                onChange={e => setForm({...form, githubUsername: e.target.value})}
                className="w-full mt-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500"
                placeholder="e.g. torvalds"
              />
            ) : (
              profile.githubUsername
                ? <a
                    href={`https://github.com/${profile.githubUsername}`}
                    target="_blank" rel="noreferrer"
                    className="text-blue-400 text-sm mt-1 hover:underline block"
                  >
                    @{profile.githubUsername}
                  </a>
                : <p className="text-gray-500 text-sm mt-1">Not connected</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-center border-t border-gray-800 pt-4">
            {[
              { label: 'Followers', val: profile.followers?.length  || 0 },
              { label: 'Following', val: profile.following?.length  || 0 },
              { label: 'Repos',     val: profile.githubRepos?.length || 0 },
            ].map(s => (
              <div key={s.label}>
                <div className="text-white font-bold text-lg">{s.val}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {isEditing && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {/* GitHub Repos */}
        {profile.githubRepos?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">GitHub Repositories</h2>
            <div className="space-y-3">
              {profile.githubRepos.slice(0, 6).map(repo => (
                <a
                  key={repo.githubRepoId || repo._id}
                  href={repo.repoUrl}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <div className="text-blue-400 text-sm font-medium">{repo.repoName}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{repo.description || 'No description'}</div>
                  </div>
                  <div className="text-gray-500 text-xs">⭐ {repo.stars}</div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}