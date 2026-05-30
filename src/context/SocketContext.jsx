// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!user) return   // only connect when logged in

    // Create ONE connection for the whole app
    const SOCKET_URL = import.meta.env.VITE_API_URL;
    const newSocket = io(SOCKET_URL)
    setSocket(newSocket)

    // Tell the server "I am online" with my userId
    newSocket.emit('join', user._id)

    // Disconnect when user logs out or component unmounts
    return () => newSocket.close()
  }, [user])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)