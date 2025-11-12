import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Wallet, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface VendorPayout {
  id: number
  vendor_name: string
  supplier_id: number | null
  supplier_full_name?: string
  supplier_city?: string
  booking_reference: string
  trip_id: string
  service_type: string
  payable_amount: number
  payment_due_date: string
  payment_status: string
  payment_date: string | null
  payment_mode: string
  transaction_reference: string
  bank_name: string
  upi_id: string
  notes: string
  created_by: string
  created_at: string
  updated_at: string
}

interface Supplier {
  id: number
  company_name: string
  city: string
}

const VendorPayoutMaster: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [payouts, setPayouts] = useState<VendorPayout[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingPayout, setEditingPayout] = useState<VendorPayout | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const [formData, setFormData] = useState({
    vendorName: '',
    supplierId: '',
    bookingReference: '',
    tripId: '',
    serviceType: 'Hotel',
    payableAmount: 0,
    paymentDueDate: '',
    paymentStatus: 'Pending',
    paymentDate: '',
    paymentMode: 'Bank Transfer',
    transactionReference: '',
    bankName: '',
    upiId: '',
    notes: ''
  })

  useEffect(() => {
    fetchPayouts()
    fetchSuppliers()
  }, [filterStatus])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const url = filterStatus === 'all' 
        ? '/api/vendor-payouts' 
        : `/api/vendor-payouts?status=${filterStatus}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPayouts(data.payouts || [])
      }
    } catch (error) {
      console.error('Error fetching vendor payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        vendor_name: formData.vendorName,
        supplier_id: formData.supplierId ? parseInt(formData.supplierId) : null,
        booking_reference: formData.bookingReference,
        trip_id: formData.tripId,
        service_type: formData.serviceType,
        payable_amount: formData.payableAmount,
        payment_due_date: formData.paymentDueDate,
        payment_status: formData.paymentStatus,
        payment_date: formData.paymentDate || null,
        payment_mode: formData.paymentMode,
        transaction_reference: formData.transactionReference,
        bank_name: formData.bankName,
        upi_id: formData.upiId,
        notes: formData.notes,
        created_by: 'Admin'
      }

      const url = '/api/vendor-payouts'
      const method = editingPayout ? 'PUT' : 'POST'
      const body = editingPayout ? { ...payload, id: editingPayout.id } : payload

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchPayouts()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to save vendor payout: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Error saving vendor payout:', error)
      alert('Failed to save vendor payout')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (payout: VendorPayout) => {
    setEditingPayout(payout)
    setFormData({
      vendorName: payout.vendor_name,
      supplierId: payout.supplier_id?.toString() || '',
      bookingReference: payout.booking_reference || '',
      tripId: payout.trip_id || '',
      serviceType: payout.service_type || 'Hotel',
      payableAmount: payout.payable_amount,
      paymentDueDate: payout.payment_due_date,
      paymentStatus: payout.payment_status || 'Pending',
      paymentDate: payout.payment_date || '',
      paymentMode: payout.payment_mode || 'Bank Transfer',
      transactionReference: payout.transaction_reference || '',
      bankName: payout.bank_name || '',
      upiId: payout.upi_id || '',
      notes: payout.notes || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vendor payout?')) return

    try {
      const response = await fetch(`/api/vendor-payouts?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchPayouts()
      } else {
        alert('Failed to delete vendor payout')
      }
    } catch (error) {
      console.error('Error deleting vendor payout:', error)
      alert('Failed to delete vendor payout')
    }
  }

  const resetForm = () => {
    setFormData({
      vendorName: '',
      supplierId: '',
      bookingReference: '',
      tripId: '',
      serviceType: 'Hotel',
      payableAmount: 0,
      paymentDueDate: '',
      paymentStatus: 'Pending',
      paymentDate: '',
      paymentMode: 'Bank Transfer',
      transactionReference: '',
      bankName: '',
      upiId: '',
      notes: ''
    })
    setEditingPayout(null)
    setShowAddForm(false)
  }

  const filteredPayouts = payouts.filter(payout =>
    payout.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payout.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payout.trip_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="h-4 w-4" />
      case 'Pending': return <Clock className="h-4 w-4" />
      case 'Overdue': return <AlertCircle className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-500'
      case 'Pending': return 'bg-yellow-500'
      case 'Overdue': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateSummary = () => {
    const total = payouts.reduce((sum, p) => sum + p.payable_amount, 0)
    const paid = payouts.filter(p => p.payment_status === 'Paid').reduce((sum, p) => sum + p.payable_amount, 0)
    const pending = payouts.filter(p => p.payment_status === 'Pending').reduce((sum, p) => sum + p.payable_amount, 0)
    const overdue = payouts.filter(p => p.payment_status === 'Overdue').reduce((sum, p) => sum + p.payable_amount, 0)

    return { total, paid, pending, overdue }
  }

  const summary = calculateSummary()

  if (showAddForm) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={resetForm}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendor Payouts
        </Button>

        <h2 className="text-2xl font-bold mb-6">
          {editingPayout ? 'Edit Vendor Payout' : 'Add New Vendor Payout'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          {/* Vendor & Booking Information */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-4">Vendor & Booking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.vendorName}
                  onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                  placeholder="Enter vendor name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link to Supplier (Optional)
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.supplierId}
                  onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                >
                  <option value="">Select supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.company_name} ({supplier.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Reference
                </label>
                <Input
                  type="text"
                  value={formData.bookingReference}
                  onChange={(e) => setFormData({...formData, bookingReference: e.target.value})}
                  placeholder="e.g., BK-2025-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trip ID
                </label>
                <Input
                  type="text"
                  value={formData.tripId}
                  onChange={(e) => setFormData({...formData, tripId: e.target.value})}
                  placeholder="e.g., TRIP-KSH-2025-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                >
                  <option value="Hotel">Hotel</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Activity">Activity</option>
                  <option value="Guide">Guide</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payable Amount * (₹)
                </label>
                <Input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.payableAmount}
                  onChange={(e) => setFormData({...formData, payableAmount: parseFloat(e.target.value) || 0})}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Due Date *
                </label>
                <Input
                  type="date"
                  required
                  value={formData.paymentDueDate}
                  onChange={(e) => setFormData({...formData, paymentDueDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Reference
                </label>
                <Input
                  type="text"
                  value={formData.transactionReference}
                  onChange={(e) => setFormData({...formData, transactionReference: e.target.value})}
                  placeholder="UTR / Transaction ID"
                />
              </div>

              {formData.paymentMode === 'Bank Transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <Input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                    placeholder="Enter bank name"
                  />
                </div>
              )}

              {formData.paymentMode === 'UPI' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UPI ID
                  </label>
                  <Input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                    placeholder="example@upi"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes or remarks"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? 'Saving...' : (editingPayout ? 'Update Payout' : 'Create Payout')}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Wallet className="mr-2 h-6 w-6" />
              Vendor Payout Master
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track supplier payments and settlement details for confirmed bookings
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor Payout
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Payable</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Paid</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.paid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.pending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Overdue</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.overdue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by vendor, booking reference, or trip ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {/* Payouts List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading vendor payouts...</p>
        </div>
      ) : filteredPayouts.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No vendor payouts found. Add your first payout!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPayouts.map((payout) => (
            <Card key={payout.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {payout.vendor_name}
                      </h3>
                      <Badge 
                        variant="default"
                        className={`flex items-center gap-1 ${getStatusColor(payout.payment_status)}`}
                      >
                        {getStatusIcon(payout.payment_status)}
                        {payout.payment_status}
                      </Badge>
                      {payout.supplier_full_name && (
                        <Badge variant="outline">
                          {payout.supplier_full_name}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                      {payout.booking_reference && (
                        <div>
                          <span className="font-medium">Booking:</span> {payout.booking_reference}
                        </div>
                      )}
                      {payout.trip_id && (
                        <div>
                          <span className="font-medium">Trip ID:</span> {payout.trip_id}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Service:</span> {payout.service_type}
                      </div>
                      <div>
                        <span className="font-medium">Due Date:</span> {new Date(payout.payment_due_date).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(payout.payable_amount)}
                      </div>
                      {payout.payment_mode && (
                        <div className="text-gray-600">
                          <span className="font-medium">Mode:</span> {payout.payment_mode}
                        </div>
                      )}
                      {payout.transaction_reference && (
                        <div className="text-gray-600">
                          <span className="font-medium">Ref:</span> {payout.transaction_reference}
                        </div>
                      )}
                    </div>

                    {payout.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        {payout.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(payout)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(payout.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default VendorPayoutMaster

