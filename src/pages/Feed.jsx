// src/pages/Feed.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'

export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts]     = useState([])
  const [content, setContent] = useState('')
  const [tags, setTags]       = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchPosts = async () => {
      try {
        const res = await API.get('/post')
        if (Array.isArray(res.data)) {
          setPosts(res.data)
        } else if (Array.isArray(res.data.posts)) {
          setPosts(res.data.posts)
        } else if (Array.isArray(res.data.data)) {
          setPosts(res.data.data)
        } else {
          setPosts([])
        }
      } catch (err) {
        console.error(err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [user])

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean)
    try {
      // Post create karo phir fresh feed lo
      await API.post('/post', { content, tags: tagArray })
      const res = await API.get('/post')
      if (Array.isArray(res.data)) setPosts(res.data)
      else if (Array.isArray(res.data.posts)) setPosts(res.data.posts)
      setContent('')
      setTags('')
    } catch (err) {
      console.error(err)
    }
  }

const handleLike = async (postId) => {
  if (!user) return
  try {
    const res = await API.put(`/post/like/${postId}`)
    
    const updatedLikes = res.data.post?.likes

    setPosts(posts.map(p => {
      if (p._id !== postId) return p
      if (updatedLikes) {
        // Backend se sahi likes array aa gaya
        return { ...p, likes: updatedLikes }
      }
      // Fallback
      const liked = p.likes?.some(id => id?.toString() === user._id?.toString())
      return {
        ...p,
        likes: liked
          ? p.likes.filter(id => id?.toString() !== user._id?.toString())
          : [...(p.likes || []), user._id]
      }
    }))
  } catch (err) {
    console.error('Like error:', err)
  }
}

  const handleComment = (postId, text) => {
    setPosts(posts.map(p =>
      p._id === postId
        ? { ...p, comments: [...(p.comments || []), { text, user }] }
        : p
    ))
  }

  const handleDelete = async (postId) => {
    await API.delete(`/post/${postId}`)
    setPosts(posts.filter(p => p._id !== postId))
  }

  if (!user) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Create post */}
        <form onSubmit={handleCreatePost} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`What are you building, ${user?.name?.split(' ')[0]}?`}
            rows={3}
            className="w-full bg-transparent text-white text-sm resize-none focus:outline-none placeholder-gray-600"
          />
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-800">
            
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >Post</button>
          </div>
        </form>

        {/* Posts list */}
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading feed...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No posts yet. Be the first! 🚀
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <PostCard
                key={post._id || index}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}