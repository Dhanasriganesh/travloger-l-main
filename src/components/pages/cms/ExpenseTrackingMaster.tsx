import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Receipt } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Expense {
  id: number
  expense_category: string
  trip_id: string
  booking_reference: string
  expense_amount: number
  payment_status: string
  payment_date: string | null
  vendor_name: string
  vendor_payout_id: number | null
  description: string
  notes: string
  receipt_url: string
  created_by: string
  created_at: string
}

const ExpenseTrackingMaster: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  
  const [formData, setFormData] = useState({
    expenseCategory: 'Hotel',
    tripId: '',
    bookingReference: '',
    expenseAmount: 0,
    paymentStatus: 'Pending',
    paymentDate: '',
    vendorName: '',
    description: '',
    notes: ''
  })

  useEffect(() => {
    fetchExpenses()
  }, [filterCategory])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const url = filterCategory === 'all' 
        ? '/api/expense-tracking' 
        : `/api/expense-tracking?category=${filterCategory}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses || [])
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        expense_category: formData.expenseCategory,
        trip_id: formData.tripId,
        booking_reference: formData.bookingReference,
        expense_amount: formData.expenseAmount,
        payment_status: formData.paymentStatus,
        payment_date: formData.paymentDate || null,
        vendor_name: formData.vendorName,
        description: formData.description,
        notes: formData.notes,
        created_by: 'Admin'
      }

      const url = '/api/expense-tracking'
      const method = editingExpense ? 'PUT' : 'POST'
      const body = editingExpense ? { ...payload, id: editingExpense.id } : payload

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchExpenses()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to save expense: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      expenseCategory: expense.expense_category,
      tripId: expense.trip_id || '',
      bookingReference: expense.booking_reference || '',
      expenseAmount: expense.expense_amount,
      paymentStatus: expense.payment_status,
      paymentDate: expense.payment_date || '',
      vendorName: expense.vendor_name || '',
      description: expense.description || '',
      notes: expense.notes || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const response = await fetch(`/api/expense-tracking?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchExpenses()
      } else {
        alert('Failed to delete expense')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense')
    }
  }

  const resetForm = () => {
    setFormData({
      expenseCategory: 'Hotel',
      tripId: '',
      bookingReference: '',
      expenseAmount: 0,
      paymentStatus: 'Pending',
      paymentDate: '',
      vendorName: '',
      description: '',
      notes: ''
    })
    setEditingExpense(null)
    setShowAddForm(false)
  }

  const filteredExpenses = expenses.filter(exp =>
    exp.trip_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const calculateSummary = () => {
    const total = expenses.reduce((sum, e) => sum + e.expense_amount, 0)
    const paid = expenses.filter(e => e.payment_status === 'Paid').reduce((sum, e) => sum + e.expense_amount, 0)
    const pending = expenses.filter(e => e.payment_status === 'Pending').reduce((sum, e) => sum + e.expense_amount, 0)

    return { total, paid, pending }
  }

  const summary = calculateSummary()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (showAddForm) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={resetForm} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Expenses
        </Button>

        <h2 className="text-2xl font-bold mb-6">
          {editingExpense ? 'Edit Expense' : 'Add New Expense'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Category *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.expenseCategory}
                onChange={(e) => setFormData({...formData, expenseCategory: e.target.value})}
              >
                <option value="Hotel">Hotel</option>
                <option value="Transfer">Transfer</option>
                <option value="Activity">Activity</option>
                <option value="Misc">Misc</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Amount * (₹)
              </label>
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.expenseAmount}
                onChange={(e) => setFormData({...formData, expenseAmount: parseFloat(e.target.value) || 0})}
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
                placeholder="TRIP-XXX-2025-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Reference
              </label>
              <Input
                type="text"
                value={formData.bookingReference}
                onChange={(e) => setFormData({...formData, bookingReference: e.target.value})}
                placeholder="BK-2025-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.paymentStatus}
                onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Name
              </label>
              <Input
                type="text"
                value={formData.vendorName}
                onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                placeholder="Vendor/Supplier name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Expense description"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
              {saving ? 'Saving...' : (editingExpense ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/settings')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Receipt className="mr-2 h-6 w-6" />
              Expense Tracking Master
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Log all trip-level and operational expenses
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Expenses</div>
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
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by trip ID, vendor, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-md"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="Hotel">Hotel</option>
          <option value="Transfer">Transfer</option>
          <option value="Activity">Activity</option>
          <option value="Misc">Misc</option>
        </select>
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading expenses...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No expenses found. Add your first expense!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{expense.expense_category}</Badge>
                      <Badge className={expense.payment_status === 'Paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {expense.payment_status}
                      </Badge>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(expense.expense_amount)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
                      {expense.trip_id && <div><span className="font-medium">Trip:</span> {expense.trip_id}</div>}
                      {expense.booking_reference && <div><span className="font-medium">Booking:</span> {expense.booking_reference}</div>}
                      {expense.vendor_name && <div><span className="font-medium">Vendor:</span> {expense.vendor_name}</div>}
                    </div>

                    {expense.description && (
                      <p className="text-sm text-gray-700 mt-2">{expense.description}</p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(expense)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(expense.id)} className="text-red-600">
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

export default ExpenseTrackingMaster



