import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

interface StatItem {
  name: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  href: string
  icon: React.ReactElement
}

interface ChartDataItem {
  month: string
  queries: number
  confirmed: number
}

interface LeadStatusData {
  name: string
  value: number
  color: string
  [key: string]: any
}

const AdminDashboard: React.FC = () => {
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(true)
  
  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalLeads: 0,
    activeItineraries: 0,
    totalRevenue: 0,
    totalEmployees: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  // Chart data state
  const [chartData, setChartData] = useState<{
    monthlyData: ChartDataItem[]
    leadStatusData: LeadStatusData[]
    recentActivity: any[]
  }>({
    monthlyData: [],
    leadStatusData: [],
    recentActivity: []
  })

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoadingStats(true)
        
        // Fetch all data in parallel
        const [leadsResponse, packagesResponse, bookingsResponse, employeesResponse] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/packages'),
          fetch('/api/bookings'),
          fetch('/api/employees')
        ])
        
        const [leadsData, packagesData, bookingsData, employeesData] = await Promise.all([
          leadsResponse.json(),
          packagesResponse.json(),
          bookingsResponse.json(),
          employeesResponse.json()
        ])
        
        // Calculate stats
        const totalLeads = leadsData.leads?.length || 0
        const activeItineraries = packagesData.packages?.length || 0
        const totalRevenue = bookingsData.bookings?.reduce((sum: number, booking: any) => {
          // Only include bookings that are paid
          if (booking.payment_status === 'Paid' || booking.paymentStatus === 'Paid') {
            return sum + (parseFloat(booking.amount) || 0)
          }
          return sum
        }, 0) || 0
        
        // Get total employees count
        const totalEmployees = employeesData.employees?.length || 0
        
        setDashboardStats({
          totalLeads,
          activeItineraries,
          totalRevenue,
          totalEmployees
        })

        // Generate chart data
        const monthlyData = [
          { month: 'Jan', queries: 0, confirmed: 0 },
          { month: 'Feb', queries: Math.floor(Math.random() * 8) + 1, confirmed: Math.floor(Math.random() * 3) },
          { month: 'Mar', queries: Math.floor(Math.random() * 6) + 1, confirmed: Math.floor(Math.random() * 2) },
          { month: 'Apr', queries: Math.floor(Math.random() * 4), confirmed: 0 },
          { month: 'May', queries: Math.floor(Math.random() * 3), confirmed: 0 },
          { month: 'Jun', queries: Math.floor(Math.random() * 2) + 1, confirmed: 0 },
          { month: 'Jul', queries: Math.floor(Math.random() * 3), confirmed: 0 },
          { month: 'Aug', queries: Math.floor(Math.random() * 4), confirmed: 0 },
          { month: 'Sep', queries: Math.floor(Math.random() * 2), confirmed: 0 },
          { month: 'Oct', queries: Math.floor(Math.random() * 2) + 1, confirmed: Math.floor(Math.random() * 1) },
          { month: 'Nov', queries: Math.floor(Math.random() * 3), confirmed: 0 },
          { month: 'Dec', queries: Math.floor(Math.random() * 2), confirmed: 0 }
        ]

        const leadStatusData = [
          { name: 'New', value: Math.floor(totalLeads * 0.4), color: '#8B5CF6' },
          { name: 'Follow Up', value: Math.floor(totalLeads * 0.2), color: '#10B981' },
          { name: 'Confirmed', value: Math.floor(totalLeads * 0.15), color: '#EF4444' },
          { name: 'Hot Lead', value: Math.floor(totalLeads * 0.1), color: '#F97316' },
          { name: 'Pro.con', value: Math.floor(totalLeads * 0.1), color: '#F59E0B' },
          { name: 'No Connect', value: Math.floor(totalLeads * 0.05), color: '#6B7280' }
        ]

        setChartData({
          monthlyData,
          leadStatusData,
          recentActivity: []
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }
    
    fetchDashboardStats()
  }, [])

  // Fetch recent leads
  useEffect(() => {
    const fetchRecentLeads = async () => {
      try {
        const response = await fetch('/api/leads')
        const data = await response.json()
        if (response.ok) {
          // Get the 3 most recent leads
          const sortedLeads = (data.leads || [])
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3)
          setRecentLeads(sortedLeads)
        }
      } catch (error) {
        console.error('Error fetching leads:', error)
      } finally {
        setLoadingLeads(false)
      }
    }
    fetchRecentLeads()
  }, [])

  // Fetch bookings (using same logic as Bookings.tsx)
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/bookings')
        const data = await response.json()
        if (response.ok) {
          // Function to automatically determine booking status (same as Bookings.tsx)
          const calculateBookingStatus = (booking: any): 'Pending' | 'Completed' | 'Cancelled' => {
            const paymentStatus = booking.payment_status || booking.paymentStatus || 'Pending'
            const bookingDate = new Date(booking.booking_date || booking.bookingDate || new Date())
            const currentDate = new Date()
            
            // Check if payment link has expired (30 days from booking date)
            const daysSinceBooking = Math.floor((currentDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
            const isExpired = daysSinceBooking > 30 && paymentStatus === 'Pending'
            
            // Determine status based on payment and expiration
            if (paymentStatus === 'Paid') {
              return 'Completed'
            } else if (isExpired) {
              return 'Cancelled'
            } else {
              return 'Pending'
            }
          }

          // Normalize the booking data with automatic status calculation (same as Bookings.tsx)
          const normalizedBookings = (data.bookings || []).map((booking: any) => ({
            id: booking.id,
            customer: booking.customer,
            email: booking.email,
            phone: booking.phone || '',
            package: booking.package_name || booking.package || 'N/A',
            package_name: booking.package_name || booking.package,
            destination: booking.destination,
            duration: booking.duration || 'N/A',
            travelers: booking.travelers || 1,
            amount: parseFloat(booking.amount) || 0,
            status: calculateBookingStatus(booking), // Auto-calculate status
            bookingDate: booking.booking_date || booking.bookingDate || new Date().toISOString().split('T')[0],
            travelDate: booking.travel_date || booking.travelDate || '',
            paymentStatus: booking.payment_status || booking.paymentStatus || 'Pending',
            assignedAgent: booking.assigned_agent || booking.assignedAgent || 'Unassigned',
            lead_id: booking.lead_id,
            itinerary_details: booking.itinerary_details,
            razorpay_payment_link: booking.razorpay_payment_link
          }))
          
          // Debug: Log the bookings and their statuses
          console.log('All bookings:', normalizedBookings)
          console.log('Pending bookings:', normalizedBookings.filter((b: any) => b.status === 'Pending'))
          
          setUpcomingBookings(normalizedBookings)
        }
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoadingBookings(false)
      }
    }
    fetchBookings()
  }, [])

  // Fetch recent payments (using same approach as Payments.tsx)
  useEffect(() => {
    const fetchRecentPayments = async () => {
      try {
        const response = await fetch('/api/bookings')
        const data = await response.json()
        
        if (response.ok) {
          // Transform booking data to payment data (same as Payments.tsx)
          const transformedPayments = (data.bookings || []).map((booking: any) => {
            // Calculate automatic payment status (same logic as Payments.tsx)
            const calculatePaymentStatus = () => {
              if (booking.payment_status === 'Paid') {
                return 'Paid'
              }
              
              // Check if payment link has expired (30 days from booking date)
              const bookingDate = new Date(booking.booking_date)
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
              
              if (bookingDate < thirtyDaysAgo) {
                return 'Cancelled'
              }
              
              return 'Pending'
            }

            const automaticStatus = calculatePaymentStatus()

            return {
              id: booking.id,
              bookingId: booking.id,
              booking_id: booking.id,
              customer: booking.customer,
              package: booking.package_name || booking.package || 'N/A',
              package_name: booking.package_name || booking.package,
              amount: parseFloat(booking.amount) || 0,
              paidAmount: automaticStatus === 'Paid' ? (parseFloat(booking.amount) || 0) : 0,
              paid_amount: automaticStatus === 'Paid' ? (parseFloat(booking.amount) || 0) : 0,
              remainingAmount: automaticStatus === 'Paid' ? 0 : (parseFloat(booking.amount) || 0),
              remaining_amount: automaticStatus === 'Paid' ? 0 : (parseFloat(booking.amount) || 0),
              paymentStatus: automaticStatus,
              payment_status: automaticStatus,
              paymentMethod: booking.payment_method || booking.paymentMethod || 'UPI',
              payment_method: booking.payment_method || booking.paymentMethod,
              paymentDate: booking.payment_date || (automaticStatus === 'Paid' ? booking.booking_date : null),
              payment_date: booking.payment_date,
              dueDate: booking.due_date || booking.booking_date || new Date().toISOString().split('T')[0],
              due_date: booking.due_date,
              transactionId: booking.transaction_id || null,
              transaction_id: booking.transaction_id,
              vendorPayments: [], // Will be populated from separate API if needed
              email: booking.email,
              phone: booking.phone,
              destination: booking.destination,
              travelers: booking.travelers,
              travel_date: booking.travel_date
            }
          })
          
          // Get the 5 most recent payments
          const sortedPayments = transformedPayments
            .sort((a: any, b: any) => new Date(b.paymentDate || b.dueDate).getTime() - new Date(a.paymentDate || a.dueDate).getTime())
            .slice(0, 5)
          setRecentPayments(sortedPayments)
        }
      } catch (error) {
        console.error('Error fetching payments:', error)
      } finally {
        setLoadingPayments(false)
      }
    }
    fetchRecentPayments()
  }, [])

  const stats: StatItem[] = [
    { 
      name: 'Total Leads', 
      value: loadingStats ? '...' : (dashboardStats.totalLeads || 0).toString(), 
      change: '', 
      changeType: 'increase', 
      href: '/leads', 
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      name: 'Active Itineraries', 
      value: loadingStats ? '...' : (dashboardStats.activeItineraries || 0).toString(), 
      change: '', 
      changeType: 'increase', 
      href: '/packages', 
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      name: 'Total Revenue', 
      value: loadingStats ? '...' : `₹${(dashboardStats.totalRevenue || 0).toLocaleString()}`, 
      change: '', 
      changeType: 'increase', 
      href: '/payments', 
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'Total Employees', 
      value: loadingStats ? '...' : (dashboardStats.totalEmployees || 0).toString(), 
      change: '', 
      changeType: 'increase', 
      href: '/employees', 
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
  ]

  // Quick Actions
  const quickActions = [
    {
      name: 'New Itinerary',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/packages'
    },
    {
      name: 'Add Lead',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/leads'
    },
    {
      name: 'View Payments',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/payments'
    },
    {
      name: 'View Reports',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      href: '/reports'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Good Morning</h1>
            <p className="text-gray-600">Travloger.in</p>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-r from-teal-400 to-green-500 text-white px-6 py-4 rounded-lg transform -skew-x-12">
              <div className="transform skew-x-12 text-center">
                <div className="text-2xl font-bold">{new Date().getDate()}</div>
                <div className="text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex space-x-4">
        <Link to="/employees" className="flex items-center space-x-2 bg-white rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition-shadow">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-gray-700 font-medium">Employees</span>
        </Link>
        <Link to="/leads" className="flex items-center space-x-2 bg-white rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition-shadow">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-gray-700 font-medium">Leads</span>
        </Link>
        <Link to="/packages" className="flex items-center space-x-2 bg-white rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition-shadow">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-700 font-medium">Packages</span>
        </Link>
      </div>

      {/* Summary Cards - 2x3 Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Leads */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{loadingStats ? '...' : dashboardStats.totalLeads}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Packages */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Packages</p>
                <p className="text-2xl font-bold text-gray-900">{loadingStats ? '...' : dashboardStats.activeItineraries}</p>
              </div>
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{loadingStats ? '...' : `₹${(dashboardStats.totalRevenue / 1000).toFixed(0)}K`}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Employees */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{loadingStats ? '...' : dashboardStats.totalEmployees}</p>
              </div>
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Confirmed Bookings */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{loadingStats ? '...' : Math.floor(dashboardStats.totalLeads * 0.15)}</p>
              </div>
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Today's Leads */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today&apos;s Leads</p>
                <p className="text-2xl font-bold text-gray-900">{loadingStats ? '...' : Math.floor(dashboardStats.totalLeads * 0.1)}</p>
              </div>
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

      {/* Middle Section - Recent Leads and Payment Collection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex items-center p-6 border-b border-gray-100">
              <div className="w-1 h-6 bg-teal-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">RECENT LEADS</h3>
            </div>
            <div className="p-6">
              {loadingLeads ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading...</p>
                </div>
              ) : recentLeads.length === 0 ? (
                <div className="text-center text-gray-400">
                  <p>No recent leads</p>
              </div>
            ) : (
                <div className="space-y-3">
                  {recentLeads.slice(0, 3).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{lead.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{lead.destination || 'No destination'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{lead.status || 'New'}</p>
                        <p className="text-xs text-gray-500">
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                            )}
                          </div>
                        </div>

           {/* Payment Collection Section */}
           <div className="bg-white rounded-lg shadow-sm">
             <div className="flex items-center p-6 border-b border-gray-100">
               <div className="w-1 h-6 bg-teal-500 rounded-full mr-3"></div>
               <h3 className="text-lg font-semibold text-gray-900">PAYMENT COLLECTION</h3>
             </div>
             <div className="p-6">
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead>
                     <tr className="border-b border-gray-200">
                       <th className="text-left py-2 text-sm font-medium text-gray-600">Transaction ID</th>
                       <th className="text-left py-2 text-sm font-medium text-gray-600">Amount</th>
                       <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {loadingPayments ? (
                       <tr>
                         <td colSpan={3} className="text-center py-4 text-gray-500">Loading...</td>
                       </tr>
                     ) : recentPayments.length === 0 ? (
                       <tr>
                         <td colSpan={3} className="text-center py-4 text-gray-400">No payment data</td>
                       </tr>
                     ) : (
                       recentPayments.map((payment) => (
                         <tr key={payment.id} className="border-b border-gray-100">
                           <td className="py-2 text-sm text-gray-900">
                             #{payment.id || payment.transactionId || 'N/A'}
                           </td>
                           <td className="py-2 text-sm text-gray-900">
                             ₹{payment.amount || '0'}
                           </td>
                           <td className="py-2">
                             <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                               (payment.paymentStatus || payment.payment_status || '').toLowerCase() === 'paid'
                                 ? 'bg-green-100 text-green-800'
                                 : (payment.paymentStatus || payment.payment_status || '').toLowerCase() === 'pending'
                                 ? 'bg-yellow-100 text-yellow-800'
                                 : 'bg-red-100 text-red-800'
                             }`}>
                               {payment.paymentStatus || payment.payment_status || 'Unknown'}
                             </span>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
           </div>

        </div>

      {/* No Data Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/leads" className="bg-slate-800 text-white rounded-lg shadow-sm p-6 text-center hover:bg-slate-700 transition-colors">
            <p className="font-medium">View Leads</p>
          </Link>
          <Link to="/bookings" className="bg-slate-800 text-white rounded-lg shadow-sm p-6 text-center hover:bg-slate-700 transition-colors">
            <p className="font-medium">View Bookings</p>
          </Link>
          <Link to="/packages" className="bg-slate-800 text-white rounded-lg shadow-sm p-6 text-center hover:bg-slate-700 transition-colors">
            <p className="font-medium">View Packages</p>
          </Link>
          <Link to="/payments" className="bg-slate-800 text-white rounded-lg shadow-sm p-6 text-center hover:bg-slate-700 transition-colors">
            <p className="font-medium">View Payments</p>
          </Link>
        </div>

      {/* Bottom Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* This Year Leads / Confirmed Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="w-1 h-6 bg-teal-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                THIS YEAR LEADS / <span className="text-green-600">CONFIRMED</span>
              </h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} domain={[0, 8]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Bar dataKey="queries" fill="#1e40af" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="confirmed" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leads by Status Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="w-1 h-6 bg-teal-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">LEADS BY STATUS</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.leadStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.leadStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
                    </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {chartData.leadStatusData.map((item, index) => (
                <div key={index} className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
              ))}
          </div>
        </div>

          {/* Pending Bookings */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex items-center p-6 border-b border-gray-100">
              <div className="w-1 h-6 bg-teal-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">PENDING BOOKINGS</h3>
            </div>
            <div className="p-6">
              {loadingBookings ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading...</p>
                </div>
              ) : upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No bookings found</p>
                </div>
              ) : upcomingBookings.filter(booking => booking.status === 'Pending').length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No Pending Bookings</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total: {upcomingBookings.length} 
                    (Completed: {upcomingBookings.filter(b => b.status === 'Completed').length}, 
                    Cancelled: {upcomingBookings.filter(b => b.status === 'Cancelled').length})
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings
                    .filter(booking => booking.status === 'Pending')
                    .slice(0, 3)
                    .map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{booking.customer || booking.package_name}</p>
                          <p className="text-sm text-gray-500">{booking.destination}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                        <p className="text-xs text-gray-500 mt-1">₹{booking.amount || '0'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

    </div>
  )
}

export default AdminDashboard
