import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface AuthErrorRecoveryProps {
  error?: string
  onRetry?: () => void
}

const AuthErrorRecovery: React.FC<AuthErrorRecoveryProps> = ({ error, onRetry }) => {
  const { clearAuthData } = useAuth()

  const handleClearAuth = async () => {
    try {
      await clearAuthData()
      // Reload the page to start fresh
      window.location.reload()
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }
  }

  const isRefreshTokenError = error?.includes('Refresh Token Not Found') || 
                             error?.includes('refresh_token_not_found') ||
                             error?.includes('Invalid Refresh Token')

  if (!isRefreshTokenError) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Authentication Error</h3>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Your session has expired or become invalid. This usually happens when:
          </p>
          <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
            <li>You&apos;ve been logged out for too long</li>
            <li>Your browser data was cleared</li>
            <li>There was a connection issue</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleClearAuth}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Clear & Restart
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          )}
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Clicking &quot;Clear &amp; Restart&quot; will:</p>
          <ul className="mt-1 list-disc list-inside">
            <li>Clear all stored authentication data</li>
            <li>Reload the page</li>
            <li>Take you back to the login screen</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AuthErrorRecovery
