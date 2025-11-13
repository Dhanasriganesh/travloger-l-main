import React from 'react'
import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Hotel, Flag, Users, Utensils, Car, Mail, CloudRain, Map, ListOrdered, Landmark, DollarSign, CalendarClock, Inbox, DollarSign as DollarIcon, Calculator, FileText, Truck, BookOpen, Image as ImageIcon, ClipboardList, Shield, Tag, Target, Wallet, Receipt, TrendingUp, Send, History } from 'lucide-react'

type MasterItem = {
  title: string
  to: string
  icon: React.ReactNode
  description?: string
}

const masters: MasterItem[] = [
  { title: 'Suppliers', to: '/settings/suppliers', icon: <Users className="h-8 w-8 text-blue-500" /> },
  { title: 'Destinations', to: '/settings/destinations', icon: <Flag className="h-8 w-8 text-blue-500" /> },
  { title: 'Room Type', to: '/settings/room-types', icon: <Landmark className="h-8 w-8 text-blue-500" /> },
  { title: 'Activity', to: '/settings/activity', icon: <ListOrdered className="h-8 w-8 text-blue-500" /> },
  { title: 'Meal Plan', to: '/settings/meal-plan', icon: <Utensils className="h-8 w-8 text-blue-500" /> },
  { title: 'Hotel', to: '/settings/hotels', icon: <Hotel className="h-8 w-8 text-blue-500" /> },
  { title: 'Hotel Rate', to: '/settings/hotel-rates', icon: <DollarIcon className="h-8 w-8 text-blue-500" /> },
  { title: 'Transfer', to: '/settings/transfer', icon: <Car className="h-8 w-8 text-blue-500" /> },
  { title: 'Vehicle Types', to: '/settings/vehicle-types', icon: <Car className="h-8 w-8 text-blue-500" /> },
  { title: 'Lead Source', to: '/settings/lead-source-detailed', icon: <Inbox className="h-8 w-8 text-blue-500" /> },
  { title: 'Lead Type Master', to: '/settings/lead-type-master', icon: <Tag className="h-8 w-8 text-blue-500" />},
  { title: 'Lead Scoring Master', to: '/settings/lead-scoring-master', icon: <Target className="h-8 w-8 text-blue-500" />},
  { title: 'Vendor Payout Master', to: '/settings/vendor-payout-master', icon: <Wallet className="h-8 w-8 text-blue-500" />},
  { title: 'Expense Tracking Master', to: '/settings/expense-tracking-master', icon: <Receipt className="h-8 w-8 text-blue-500" />},
  { title: 'Profit Calculation Master', to: '/settings/profit-calculation-master', icon: <TrendingUp className="h-8 w-8 text-blue-500" />},
  { title: 'Notification Template Master', to: '/settings/notification-template-master', icon: <Send className="h-8 w-8 text-blue-500" />},
  { title: 'Audit Log Master', to: '/settings/audit-log-master', icon: <History className="h-8 w-8 text-blue-500" />},
  { title: 'Day Itinerary', to: '/settings/day-itinerary', icon: <CalendarClock className="h-8 w-8 text-blue-500" /> },
  { title: 'Package Theme', to: '/settings/package-theme', icon: <Map className="h-8 w-8 text-blue-500" /> },
  { title: 'Mail Setting', to: '/settings/mail', icon: <Mail className="h-8 w-8 text-blue-500" /> },
  { title: 'Weather Setting', to: '/settings/weather', icon: <CloudRain className="h-8 w-8 text-green-500" /> },
  { title: 'Currency', to: '/settings/currency', icon: <DollarSign className="h-8 w-8 text-blue-500" /> },
  { title: 'Query Status', to: '/settings/query-status', icon: <Map className="h-8 w-8 text-blue-500" /> },
  { title: 'Pricing & Tax Rule', to: '/settings/pricing-tax-rule', icon: <Calculator className="h-8 w-8 text-blue-500" /> },
  { title: 'Policy', to: '/settings/policy', icon: <FileText className="h-8 w-8 text-blue-500" /> },
  { title: 'Vehicle & Driver', to: '/settings/vehicle-driver', icon: <Truck className="h-8 w-8 text-blue-500" /> },
  { title: 'Itinerary Template Library', to: '/settings/itinerary-template', icon: <BookOpen className="h-8 w-8 text-blue-500" /> },
  { title: 'Media Library', to: '/settings/media-library', icon: <ImageIcon className="h-8 w-8 text-blue-500" /> },
  { title: 'Itinerary Notes & Inclusions Library', to: '/settings/itinerary-notes-inclusions', icon: <ClipboardList className="h-8 w-8 text-blue-500" /> },
  { title: 'User Role & Access Master', to: '/settings/user-role-access', icon: <Shield className="h-8 w-8 text-blue-500" /> },
]

const Settings: React.FC = () => {
  const location = useLocation()
  
  // Default to admin settings if no specific route
  const isAdminSettings = location.pathname === '/settings' || location.pathname === '/settings/admin'
  const isPackageInclusions = location.pathname === '/settings/package-inclusions'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {isAdminSettings && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin Settings</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Masters</h3>
              <p className="text-gray-600 mb-6">All settings related to system masters like your contracted hotels, transfers, activities.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {masters.map((item) => (
                  <Link key={item.title} to={item.to} className="group">
                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {isPackageInclusions && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Package Inclusions</h2>
            <div className="text-gray-600">
              <p>Package inclusions settings content will be implemented here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings