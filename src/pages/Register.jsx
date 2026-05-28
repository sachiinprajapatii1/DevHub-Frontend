// src/pages/RegisterPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

export default function RegisterPage() {
  const [form, setForm]     = useState({
    name: '', email: '', password: '', githubUsername: ''
  })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  // One handler for ALL inputs — reads the input's name attribute
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await API.post('/auth/register', form)
      login(res.data.user, res.data.token)
      navigate('/feed')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md border border-gray-800">

        <h1 className="text-2xl font-bold text-white mb-2">Join DevHub</h1>
        <p className="text-gray-400 mb-6">Create your developer profile</p>

        {error && (
          <div className="bg-red-900/40 text-red-400 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: 'Full Name',        name: 'name',           type: 'text',     ph: 'Ada Lovelace' },
            { label: 'Email',            name: 'email',          type: 'email',    ph: 'ada@example.com' },
            { label: 'Password',         name: 'password',       type: 'password', ph: '••••••••' },
            { label: 'GitHub Username',  name: 'githubUsername', type: 'text',     ph: 'adalovelace' },
          ].map(field => (
            <div key={field.name}>
              <label className="text-sm text-gray-400 mb-1 block">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                required
                placeholder={field.ph}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}