// src/components/PostCard.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

export default function PostCard({ post, onLike, onComment, onDelete }) {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [comment, setComment]         = useState('')
  const [showComments, setShowComments] = useState(false)

  const likes    = post.likes    || []
  const comments = post.comments || []
  const tags     = post.tags     || []

  const isLiked = likes.some(id => id?.toString() === user?._id?.toString())
  const isAuthor = post.user?._id === user?._id

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    await API.post(`/post/comment/${post._id}`, { text: comment })
    onComment(post._id, comment)
    setComment('')
  }

  // ✅ Profile pe navigate karo
  const goToProfile = () => {
    if (!post.user?._id) return
    if (post.user._id === user?._id) {
      navigate('/profile')        // apni profile
    } else {
      navigate(`/user/${post.user._id}`)  // doosre ki profile
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">

      {/* Author row — clickable */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={goToProfile}
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm group-hover:ring-2 group-hover:ring-blue-400 transition-all">
            {post.user?.name?.[0]}
          </div>
          <div>
            <div className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">
              {post.user?.name}
            </div>
            <div className="text-gray-500 text-xs">
              {post.createdAt
                ? new Date(post.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })
                : 'Just now'}
            </div>
          </div>
        </div>

        {isAuthor && (
          <button
            onClick={() => onDelete(post._id)}
            className="text-gray-600 hover:text-red-400 text-xs transition-colors"
          >Delete</button>
        )}
      </div>

      {/* Content */}
      <p className="text-gray-200 text-sm leading-relaxed mb-4">{post.content}</p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(tag => (
            <span key={tag} className="text-xs bg-blue-900/40 text-blue-400 px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-5 text-sm border-t border-gray-800 pt-3">
        <button
          onClick={() => onLike(post._id)}
          className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
        >
          {isLiked ? '❤️' : '🤍'} {likes.length}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-400 transition-colors"
        >
          💬 {comments.length}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 space-y-2">
          {comments.map((c, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span
                className="text-blue-400 font-medium cursor-pointer hover:underline"
                onClick={() => c.user?._id && navigate(
                  c.user._id === user?._id ? '/profile' : `/user/${c.user._id}`
                )}
              >
                {c.user?.name}:
              </span>
              <span className="text-gray-300">{c.text}</span>
            </div>
          ))}

          <form onSubmit={handleComment} className="flex gap-2 mt-3">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  )
}