import { createContext, useContext, useEffect, useState } from 'react'
import { axiosInstance } from '../axiosCalls/axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get('/customers/me')
        setUser(res.data.authenticatedUser || res.data.customer || res.data.user || res.data)
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, setuser: setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
