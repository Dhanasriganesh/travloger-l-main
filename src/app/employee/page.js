'use client'

import React from 'react'
import { AuthProvider } from '../../contexts/AuthContext'
import Employeedashboard from '../../components/pages/Employeedashboard'

export default function EmployeePage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Employeedashboard />
      </div>
    </AuthProvider>
  )
}



