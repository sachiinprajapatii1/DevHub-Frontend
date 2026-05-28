import { useContext, createContext, useState } from "react";

const AuthContext = createContext();
export const AuthProvider = ({ children }) => {

  // ✅ localStorage se user bhi load karo start mein
  const [user, setUser]   = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(localStorage.getItem('token'))

  const login = (userData, tokenData) => {
    setUser(userData)
    setToken(tokenData)
    localStorage.setItem('token', tokenData)
    localStorage.setItem('user', JSON.stringify(userData)) // ← save karo
    console.log('token:', localStorage.getItem('token'))
    console.log('user:', localStorage.getItem('user'))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user') // ← clear karo
    
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}


export const useAuth = () => useContext(AuthContext)