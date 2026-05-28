// src/App.jsx
import React from 'react'
import { useAuth } from './context/AuthContext'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import Explore from './pages/Explore'
import Chat from './pages/Chat'
import Notification from './pages/Notification'
import FeedPage from './pages/Feed'

const PrivateRoute = ({ children }) => {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

const App = () => {
  return (
    <Routes>
      <Route path='/login'    element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/feed' element={<PrivateRoute><FeedPage /></PrivateRoute>} />
      <Route path='/profile' element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path='/user/:userId' element={<PrivateRoute><UserProfile /></PrivateRoute>} />
      <Route path='/explore' element={<PrivateRoute><Explore /></PrivateRoute>} />
      <Route path='/chat' element={<PrivateRoute><Chat /></PrivateRoute>} />
      <Route path='/notification' element={<PrivateRoute><Notification /></PrivateRoute>} />
      <Route path='*' element={<Navigate to='/login' />} />
    </Routes>
  )
}

export default App