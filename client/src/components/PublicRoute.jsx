import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function PublicRoute({ children }) {
  // we check if authenticated user data is present
  // if present we direct user from 'children' to home page
  // if not - we stay on 'children'

  const { user } = useAuth()

  if (user) {
    return <Navigate to="/home" />
  }

  return children
}

export default PublicRoute
