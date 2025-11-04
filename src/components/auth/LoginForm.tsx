'use client'

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Image from 'next/image'
import logo from '../../assets/images/logo.png'
import travelIllustration from '../../assets/images/in.png'
import { EyeIcon, EyeSlashIcon } from '../ui/Icons'
import { useAuth } from '../../contexts/AuthContext'
import ChangePasswordModal from './ChangePasswordModal'

interface LoginFormProps {}

const LoginForm: React.FC<LoginFormProps> = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const { login, checkFirstLogin, user } = useAuth()

  // Handle redirect after user state is updated
  useEffect(() => {
    if (shouldRedirect && user) {
      const userRole = user.role
      console.log('useEffect - User role for redirect:', userRole)
      console.log('useEffect - Full user object:', user)
      
      if (userRole === 'employee') {
        console.log('useEffect - Redirecting to employee dashboard')
        window.location.href = '/employee'
      } else {
        console.log('useEffect - Redirecting to admin dashboard')
        window.location.href = '/'
      }
      setShouldRedirect(false)
    }
  }, [user, shouldRedirect])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Sending login data:', formData)
      
      // Use AuthContext login method
      await login(formData.email, formData.password)
      
      // Check if this is the user's first login
      const isFirstLogin = await checkFirstLogin(formData.email)
      
      if (isFirstLogin) {
        setShowChangePasswordModal(true)
      } else {
        // Set flag to trigger redirect in useEffect
        setShouldRedirect(true)
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChangeSuccess = () => {
    setShowChangePasswordModal(false)
    // Set flag to trigger redirect in useEffect
    setShouldRedirect(true)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding and Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 to-teal-700 relative overflow-hidden">
        <div className="flex flex-col justify-center items-center w-full px-12 text-white">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <Image 
                src={logo} 
                alt="Travloger" 
                width={200} 
                height={40} 
                className="mx-auto"
              />
            </div>
            <p className="text-lg opacity-90 flex items-center justify-center">
            
              <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </p>
          </div>
          
          {/* Travel Illustration */}
          <div className="w-full max-w-md">
            <Image 
              src={travelIllustration} 
              alt="Travel illustration" 
              width={400} 
              height={300} 
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 bg-black flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-white mb-8">Log In</h2>
        
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter your Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-teal-500 focus:ring-teal-500 border-gray-600 rounded bg-gray-800"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
                Remember me
              </label>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Contact your administrator for account access
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
        userEmail={formData.email}
      />
    </div>
  )
}

export default LoginForm
