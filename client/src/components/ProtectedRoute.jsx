import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  // we check if authenticated user data is present
  // if present then we stay on children
  // otherwise we direct to signup/login page

  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>

          {/* Loading text */}
          <p className="text-slate-400 text-sm font-medium">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return children
}

export default ProtectedRoute
