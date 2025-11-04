'use client'

import React from 'react'
import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import Layout from './layout/Layout'
import EmployeeLayout from './layout/EmployeeLayout'
import Routers from './routers/Routers'
import { useAuth } from '../contexts/AuthContext'

const AppContent: React.FC = () => {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isEmployee = user?.role === 'employee'
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return <Routers />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isEmployee ? (
        <EmployeeLayout>
          <Routers />
        </EmployeeLayout>
      ) : (
        <Layout>
          <Routers />
        </Layout>
      )}
    </div>
  )
}

const ClientApp: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default ClientApp
