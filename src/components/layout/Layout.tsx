'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import logo from '../../assets/images/logo.png'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  PhotoIcon,
  DocumentTextIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '../ui/Icons'
import { Settings as SettingsIcon, CheckSquare } from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavigationSection {
  title?: string
  items: NavigationItem[]
}

interface LayoutProps {
  children: React.ReactNode
}

const navigationSections: NavigationSection[] = [
  {
    items: [
      { name: 'Dashboard', href: '/', icon: HomeIcon },
      { name: 'Employees', href: '/employees', icon: UserGroupIcon }
    ]
  },
  {
    items: [
    
      { name: 'Leads', href: '/leads', icon: UserGroupIcon },
      { name: 'Bookings', href: '/bookings', icon: ClipboardDocumentListIcon },
      { name: 'Payments', href: '/payments', icon: CurrencyRupeeIcon },
      { name: 'Reports', href: '/reports', icon: ChartBarIcon }
    ]
  },
  {
    items: [
      { name: 'Main Website Edit', href: '/main-website-edit', icon: DocumentTextIcon },
      { name: 'Website Edit', href: '/website-edit', icon: DocumentTextIcon },
      { name: 'Itinerary Builder', href: '/packages', icon: ClipboardDocumentListIcon },
      { name: 'Queries', href: '/queries', icon: UserGroupIcon },
      { name: 'Settings', href: '/settings', icon: CogIcon }
    ]
  }
]

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false)
  const [settingsSubmenuOpen, setSettingsSubmenuOpen] = useState<boolean>(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()

  // Check if we're on settings page
  const isSettingsPage = location.pathname.startsWith('/settings')
  
  // Check if we're on suppliers, destinations, room types, activities, meal plans, hotels, or transfers page (should collapse all sidebars)
  const isSuppliersPage = location.pathname === '/settings/suppliers'
  const isDestinationsPage = location.pathname === '/settings/destinations'
  const isRoomTypesPage = location.pathname === '/settings/room-types'
  const isActivitiesPage = location.pathname === '/settings/activity'
  const isMealPlansPage = location.pathname === '/settings/meal-plan'
  const isHotelsPage = location.pathname === '/settings/hotels'
  const isHotelRatesPage = location.pathname === '/settings/hotel-rates'
  const isTransfersPage = location.pathname === '/settings/transfer'
  const isVehicleTypesPage = location.pathname === '/settings/vehicle-types'
  const isLeadSourceDetailedPage = location.pathname === '/settings/lead-source-detailed'
  const isLeadTypeMasterPage = location.pathname === '/settings/lead-type-master'
  const isLeadScoringMasterPage = location.pathname === '/settings/lead-scoring-master'
  const isVendorPayoutMasterPage = location.pathname === '/settings/vendor-payout-master'
  const isExpenseTrackingMasterPage = location.pathname === '/settings/expense-tracking-master'
  const isDayItineraryPage = location.pathname === '/settings/day-itinerary'
  const isPackageThemePage = location.pathname === '/settings/package-theme'
  const isQueryStatusPage = location.pathname === '/settings/query-status'
  const isPricingTaxRulePage = location.pathname === '/settings/pricing-tax-rule'
  const isPolicyPage = location.pathname === '/settings/policy'
  const isVehicleDriverPage = location.pathname === '/settings/vehicle-driver'
  const isItineraryTemplatePage = location.pathname === '/settings/itinerary-template'
  const isMediaLibraryPage = location.pathname === '/settings/media-library'
  const isItineraryNotesInclusionsPage = location.pathname === '/settings/itinerary-notes-inclusions'
  const isUserRoleAccessPage = location.pathname === '/settings/user-role-access'
  
  // Auto-open settings submenu when on settings pages
  useEffect(() => {
    const pathname = location.pathname
    const isSettings = pathname.startsWith('/settings')
    const isSpecific =
      pathname === '/settings/suppliers' ||
      pathname === '/settings/destinations' ||
      pathname === '/settings/room-types' ||
      pathname === '/settings/activity' ||
      pathname === '/settings/meal-plan' ||
      pathname === '/settings/hotels' ||
      pathname === '/settings/hotel-rates' ||
      pathname === '/settings/transfer' ||
      pathname === '/settings/vehicle-types' ||
      pathname === '/settings/lead-source-detailed' ||
      pathname === '/settings/day-itinerary' ||
      pathname === '/settings/package-theme' ||
      pathname === '/settings/query-status' ||
      pathname === '/settings/pricing-tax-rule' ||
      pathname === '/settings/policy' ||
      pathname === '/settings/vehicle-driver' ||
      pathname === '/settings/itinerary-template' ||
      pathname === '/settings/media-library' ||
      pathname === '/settings/itinerary-notes-inclusions' ||
      pathname === '/settings/user-role-access'
    setSettingsSubmenuOpen(isSettings && !isSpecific)
  }, [location.pathname])

  // Handle logout
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    handleLogout()
  }

  // Don't render layout for auth pages
  if (location.pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setSidebarOpen(false)} 
          />
        </div>
      )}

      {/* Main Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${sidebarCollapsed ? 'w-12 bg-slate-800' : 'w-48 bg-slate-800 shadow-xl'}`}>
        {/* Logo Section */}
        <div className={`flex items-center justify-between h-10 px-1 py-1 border-b ${
          sidebarCollapsed ? 'bg-slate-800 border-gray-600' : 'bg-slate-800 border-gray-600'
        }`}>
          {!sidebarCollapsed && (
            <Link to="/" className="inline-flex items-center px-1 py-1">
              <Image src={logo} alt="Travloger.in" width={100} height={20} priority />
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="flex items-center justify-center w-full">
              <span className="text-gray-200 text-[6px] font-medium">T</span>
            </div>
          )}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-1'}`}>
            <button
              className={`hidden lg:block p-0.5 rounded-md transition-colors ${
                sidebarCollapsed 
                  ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' 
                  : 'text-gray-300 hover:text-gray-100 hover:bg-gray-700'
              }`}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-2.5 w-2.5" />
              ) : (
                <ChevronLeftIcon className="h-2.5 w-2.5" />
              )}
            </button>
            <button
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 flex flex-col ${sidebarCollapsed ? 'px-0.5 py-1' : 'px-2 py-2'}`}>
          <div className="flex flex-col justify-evenly flex-1 space-y-1">
            {navigationSections.map((section, idx) => (
              <React.Fragment key={idx}>
                {section.title && !sidebarCollapsed && (
                  <div className="px-2 pb-1 text-[9px] font-semibold tracking-wide text-gray-400 uppercase">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href
                  const isSettingsItem = item.name === 'Settings'
                  
                  return (
                    <div key={item.name}>
                      <Link
                        to={item.href}
                        onClick={() => {
                          // Close mobile sidebar when navigation item is clicked
                          if (window.innerWidth < 1024) {
                            setSidebarOpen(false)
                          }
                          // Toggle settings submenu
                          if (isSettingsItem) {
                            setSettingsSubmenuOpen(!settingsSubmenuOpen)
                          }
                        }}
                        className={`group flex items-center transition-all duration-200 relative ${
                          sidebarCollapsed 
                            ? 'justify-center p-1.5' + (isActive ? ' bg-gray-300 rounded-sm' : '')
                            : 'px-2 py-1.5 text-xs font-medium rounded-md' + (
                                isActive
                                  ? ' bg-gray-300 text-gray-800'
                                  : ' text-gray-300 hover:bg-gray-700 hover:text-gray-100'
                              )
                        }`}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        {/* Active indicator line for expanded sidebar */}
                        {isActive && !sidebarCollapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-600 rounded-r-full"></div>
                        )}
                        
                        <item.icon className={`flex-shrink-0 ${
                          sidebarCollapsed 
                            ? 'h-5 w-5' + (isActive ? ' text-gray-700' : ' text-gray-300')
                            : 'h-4 w-4 mr-2' + (isActive ? ' text-gray-800' : ' text-gray-300 group-hover:text-gray-100')
                        }`} />
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.name}</span>
                        )}
                      </Link>
                      
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className={`flex-shrink-0 border-t ${
          sidebarCollapsed ? 'p-0.5 border-gray-600' : 'p-1 border-gray-600'
        }`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-1'}`}>
            <div className={`rounded-full flex items-center justify-center ${
              sidebarCollapsed ? 'h-5 w-5 bg-gray-600' : 'h-5 w-5 bg-primary'
            }`}>
              <span className={`text-white font-medium ${
                sidebarCollapsed ? 'text-[10px]' : 'text-[10px]'
              }`}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-gray-200 truncate">{user?.name || 'User'}</p>
                <p className="text-[8px] text-gray-400 truncate capitalize">{user?.role || 'User'}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full mt-1 px-1 py-0.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </div>

      {/* Settings Sidebar */}
      {isSettingsPage && !isSuppliersPage && !isDestinationsPage && !isRoomTypesPage && !isActivitiesPage && !isMealPlansPage && !isHotelsPage && !isHotelRatesPage && !isTransfersPage && !isVehicleTypesPage && !isLeadSourceDetailedPage && !isLeadTypeMasterPage && !isLeadScoringMasterPage && !isVendorPayoutMasterPage && !isExpenseTrackingMasterPage && !isDayItineraryPage && !isPackageThemePage && !isQueryStatusPage && !isPricingTaxRulePage && !isPolicyPage && !isVehicleDriverPage && !isItineraryTemplatePage && !isMediaLibraryPage && !isItineraryNotesInclusionsPage && !isUserRoleAccessPage && (
        <div className={`fixed inset-y-0 z-40 w-56 bg-slate-700 shadow-xl border-r border-gray-600 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'left-12' : 'left-48'
        }`} style={{ left: sidebarCollapsed ? '48px' : '192px' }}>
          <div className="flex flex-col h-full">
            {/* Settings Header */}
            <div className="flex items-center justify-between h-10 px-3 py-1 border-b border-gray-600">
              <h2 className="text-sm font-semibold text-gray-200">Settings</h2>
            </div>
            
            {/* Settings Navigation */}
            <nav className="flex-1 px-3 py-4">
              <div className="space-y-1">
                <Link
                  to="/settings/admin"
                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    location.pathname === '/settings/admin' || location.pathname === '/settings'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-300 hover:bg-gray-600 hover:text-gray-100'
                  }`}
                >
                  <SettingsIcon className="h-4 w-4 mr-3" />
                  Admin Settings
                </Link>
                <Link
                  to="/settings/package-inclusions"
                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    location.pathname === '/settings/package-inclusions'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-300 hover:bg-gray-600 hover:text-gray-100'
                  }`}
                >
                  <CheckSquare className="h-4 w-4 mr-3" />
                  Package Inclusions
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out`} style={{ marginLeft: isSettingsPage && !isSuppliersPage && !isDestinationsPage && !isRoomTypesPage && !isActivitiesPage && !isMealPlansPage && !isHotelsPage && !isHotelRatesPage && !isTransfersPage && !isVehicleTypesPage && !isLeadSourceDetailedPage && !isLeadTypeMasterPage && !isLeadScoringMasterPage && !isVendorPayoutMasterPage && !isExpenseTrackingMasterPage && !isDayItineraryPage && !isPackageThemePage && !isQueryStatusPage && !isPricingTaxRulePage && !isPolicyPage && !isVehicleDriverPage && !isItineraryTemplatePage && !isMediaLibraryPage && !isItineraryNotesInclusionsPage && !isUserRoleAccessPage ? (sidebarCollapsed ? '272px' : '240px') : '0' }}>
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-3">
            <button
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(true)}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            
            <div className="flex items-center justify-end w-full gap-1">
              {/* User Profile with Avatar and Info */}
              <button 
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center hover:bg-gray-50 rounded-md p-1 transition-colors"
                title="Click to logout"
              >
                <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-700 text-[10px] font-semibold">
                    {user?.name?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase() || 'AD'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="w-full max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with light transparency */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm Logout
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to logout? You will need to sign in again to access the admin panel.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                > 
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
