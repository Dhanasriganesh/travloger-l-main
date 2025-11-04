'use client'

import React from 'react'
import { AuthProvider } from '../../contexts/AuthContext'
import LoginForm from './LoginForm'

const AuthPage: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <LoginForm />
      </div>
    </AuthProvider>
  )
}

export default AuthPage
