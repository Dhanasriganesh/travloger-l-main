import React, { useState, useEffect } from 'react'
import {
  CurrencyRupeeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CreditCardIcon,
  SmartphoneIcon,
  BuildingLibraryIcon,
  WalletIcon,
  BanknotesIcon,
  LinkIcon,
  CalendarIcon,
  HashtagIcon,
  TrashIcon,
  ReceiptIcon,
  ArrowPathIcon
} from '../../ui/Icons'

interface VendorPayment {
  vendor: string
  amount: number
  status: 'Paid' | 'Pending'
  date: string
}

interface Payment {
  id: number
  bookingId: number
  booking_id?: number
  customer: string
  package: string
  package_name?: string
  amount: number
  paidAmount: number
  paid_amount?: number
  remainingAmount: number
  remaining_amount?: number
  paymentStatus: 'Paid' | 'Partial' | 'Pending' | 'Overdue' | 'Cancelled'
  payment_status?: string
  paymentMethod: string
  payment_method?: string
  paymentDate: string | null
  payment_date?: string
  dueDate: string
  due_date?: string
  transactionId: string | null
  transaction_id?: string
  vendorPayments: VendorPayment[]
  email?: string
  phone?: string
  destination?: string
  travelers?: number
  travel_date?: string
}

type FilterType = 'all' | 'paid' | 'pending' | 'cancelled'

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')

  // Fetch payments from API
  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bookings')
      const data = await response.json()
      
      if (response.ok) {
        // Transform booking data to payment data
        const transformedPayments = (data.bookings || []).map((booking: any) => {
          // Calculate automatic payment status
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
        setPayments(transformedPayments)
        setError(null)
      } else {
        setError(data.error || 'Failed to load payments')
      }
    } catch (err: any) {
      console.error('Error fetching payments:', err)
      setError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  // Filter payments based on month and year
  const getFilteredPayments = (): Payment[] => {
    if (selectedMonth === 'all' && selectedYear === 'all') return payments

    const filteredPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate || payment.dueDate)
      const paymentMonth = (paymentDate.getMonth() + 1).toString() // getMonth() returns 0-11, so add 1
      const paymentYear = paymentDate.getFullYear().toString()

      const monthMatch = selectedMonth === 'all' || paymentMonth === selectedMonth
      const yearMatch = selectedYear === 'all' || paymentYear === selectedYear

      return monthMatch && yearMatch
    })

    return filteredPayments
  }

  const filteredPayments = getFilteredPayments().filter(payment => {
    if (filter === 'all') return true
    return payment.paymentStatus.toLowerCase() === filter.toLowerCase()
  })

  const getStatusColor = (status: string): string => {
    return 'bg-slate-100 text-slate-800'
  }

  const getVendorStatusColor = (status: string): string => {
    return 'bg-slate-100 text-slate-800'
  }

  const getPaymentMethodIcon = (method: string): React.ReactNode => {
    const methodLower = method.toLowerCase()
    if (methodLower.includes('upi')) return <SmartphoneIcon className="w-3 h-3" />
    if (methodLower.includes('credit') || methodLower.includes('card')) return <CreditCardIcon className="w-3 h-3" />
    if (methodLower.includes('debit')) return <CreditCardIcon className="w-3 h-3" />
    if (methodLower.includes('netbanking') || methodLower.includes('bank')) return <BuildingLibraryIcon className="w-3 h-3" />
    if (methodLower.includes('wallet')) return <WalletIcon className="w-3 h-3" />
    if (methodLower.includes('cash')) return <BanknotesIcon className="w-3 h-3" />
    return <CurrencyRupeeIcon className="w-3 h-3" />
  }

  const formatPaymentMethod = (method: string): string => {
    const methodLower = method.toLowerCase()
    if (methodLower.includes('upi')) return 'UPI'
    if (methodLower.includes('credit')) return 'Credit Card'
    if (methodLower.includes('debit')) return 'Debit Card'
    if (methodLower.includes('netbanking')) return 'Net Banking'
    if (methodLower.includes('bank')) return 'Bank Transfer'
    if (methodLower.includes('wallet')) return 'Digital Wallet'
    if (methodLower.includes('cash')) return 'Cash'
    return method
  }

  const openPaymentDetails = (payment: Payment): void => {
    setSelectedPayment(payment)
    setShowModal(true)
  }


  const handleDeletePayment = async (paymentId: number): Promise<void> => {
    try {
      setDeleting(true)
      const response = await fetch('/api/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId })
      })
      
      if (response.ok) {
        setPayments(payments.filter(payment => payment.id !== paymentId))
        setShowDeleteModal(false)
        setPaymentToDelete(null)
        alert('Payment record deleted successfully')
      } else {
        // Handle non-JSON responses gracefully
        let errorMessage = 'Unknown error'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json()
            errorMessage = data.error || 'Unknown error'
          } else {
            // If response is not JSON, get text content
            const textResponse = await response.text()
            errorMessage = textResponse || `HTTP ${response.status}: ${response.statusText}`
          }
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        alert('Failed to delete payment: ' + errorMessage)
      }
    } catch (error: any) {
      console.error('Error deleting payment:', error)
      alert('Failed to delete payment record: ' + (error.message || 'Network error'))
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteModal = (payment: Payment): void => {
    setPaymentToDelete(payment)
    setShowDeleteModal(true)
  }

  const totalRevenue = payments
    .filter(p => p.paymentStatus === 'Paid')
    .reduce((sum, payment) => sum + payment.paidAmount, 0)

  const pendingAmount = payments
    .filter(p => p.paymentStatus !== 'Paid')
    .reduce((sum, payment) => sum + payment.remainingAmount, 0)

  const overduePayments = payments.filter(p => 
    p.paymentStatus !== 'Paid' && 
    new Date(p.dueDate) < new Date()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Transactions</h1>
          <p className="text-gray-600">Track payment methods, transaction details, and financial records</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Month Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          
          {/* Year Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
          </div>
          
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-slate-800 rounded-md flex items-center justify-center">
                  <CurrencyRupeeIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-800 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-slate-800">₹{totalRevenue.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-slate-800 rounded-md flex items-center justify-center">
                  <ClockIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-800 truncate">Pending Amount</dt>
                  <dd className="text-lg font-medium text-slate-800">₹{pendingAmount.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-slate-800 rounded-md flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-800 truncate">Overdue</dt>
                  <dd className="text-lg font-medium text-slate-800">{overduePayments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-slate-800 rounded-md flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-800 truncate">Paid</dt>
                  <dd className="text-lg font-medium text-slate-800">{payments.filter(p => p.paymentStatus === 'Paid').length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({payments.length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'paid' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Paid ({payments.filter(p => p.paymentStatus === 'Paid').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'cancelled' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled ({payments.filter(p => p.paymentStatus === 'Cancelled').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'pending' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({payments.filter(p => p.paymentStatus === 'Pending').length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button onClick={fetchPayments} className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium">
            Try Again
          </button>
        </div>
      )}

      {/* Payments Table */}
      {!loading && !error && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium mb-2">No payments found</p>
              <p className="text-sm">Payments will appear here once customers make payments.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">{payment.customer}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{payment.package}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        ₹{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        ₹{payment.paidAmount.toLocaleString()}
                        {payment.remainingAmount > 0 && (
                          <div className="text-red-500">Due: ₹{payment.remainingAmount.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(payment.paymentStatus)}`}>
                          {payment.paymentStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <span className="text-xs text-gray-900">{formatPaymentMethod(payment.paymentMethod)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {payment.transactionId ? (
                            <div className="flex items-center space-x-1">
                              <LinkIcon className="w-3 h-3" />
                              <span className="truncate max-w-20">{payment.transactionId}</span>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <button
                          onClick={() => openPaymentDetails(payment)}
                          className="text-slate-800 hover:opacity-80 mr-3"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => openDeleteModal(payment)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete Payment Record"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Transaction Details */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Payment Transaction Details</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="text-sm text-gray-900 flex items-center space-x-2">
                      {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                      <span>{formatPaymentMethod(selectedPayment.paymentMethod)}</span>
                    </p>
                  </div>
                  {selectedPayment.transactionId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                      <p className="text-sm text-gray-900 font-mono flex items-center space-x-2">
                        <LinkIcon className="w-4 h-4" />
                        <span>{selectedPayment.transactionId}</span>
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.paymentStatus)}`}>
                      {selectedPayment.paymentStatus}
                    </span>
                  </div>
                  {selectedPayment.paymentDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                      <p className="text-sm text-gray-900 flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(selectedPayment.paymentDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <p className="text-sm text-gray-900 flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{new Date(selectedPayment.dueDate).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Booking Reference</label>
                    <p className="text-sm text-gray-900 flex items-center space-x-2">
                      <HashtagIcon className="w-4 h-4" />
                      <span>#{selectedPayment.bookingId}</span>
                    </p>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Financial Breakdown</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="text-lg font-semibold text-gray-900">₹{selectedPayment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Paid Amount</label>
                    <p className="text-lg font-semibold text-green-600">₹{selectedPayment.paidAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Remaining Amount</label>
                    <p className={`text-lg font-semibold ${selectedPayment.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{selectedPayment.remainingAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Progress</label>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(selectedPayment.paidAmount / selectedPayment.amount) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((selectedPayment.paidAmount / selectedPayment.amount) * 100)}% Complete
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer & Package Info (Minimal) */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Related Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer</label>
                    <p className="text-sm text-gray-900">{selectedPayment.customer}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Package</label>
                    <p className="text-sm text-gray-900">{selectedPayment.package}</p>
                  </div>
                </div>
              </div>

              {/* Vendor Payments */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Vendor Payments</h4>
                {selectedPayment.vendorPayments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPayment.vendorPayments.map((vendor, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{vendor.vendor}</p>
                            <p className="text-xs text-gray-500">Due: {new Date(vendor.date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">₹{vendor.amount}</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVendorStatusColor(vendor.status)}`}>
                              {vendor.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No vendor payments recorded</p>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                >
                  Close
                </button>
                {selectedPayment.paymentStatus !== 'Paid' && (
                  <button className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm flex items-center space-x-1">
                    <CurrencyRupeeIcon className="w-4 h-4" />
                    <span>Record Payment</span>
                  </button>
                )}
                <button className="px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm flex items-center space-x-1">
                  <ReceiptIcon className="w-4 h-4" />
                  <span>Generate Receipt</span>
                </button>
                <button className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm flex items-center space-x-1">
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Update Payment Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && paymentToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Payment Record</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Are you sure you want to delete this payment record?
                </h3>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Customer:</strong> {paymentToDelete.customer}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Amount:</strong> ₹{paymentToDelete.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Payment Method:</strong> {formatPaymentMethod(paymentToDelete.paymentMethod)}
                  </p>
                </div>
                
                <p className="text-sm text-gray-500 mb-6">
                  This action cannot be undone. The payment record will be permanently removed from the database.
                </p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeletePayment(paymentToDelete.id)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50"
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete Record'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments
