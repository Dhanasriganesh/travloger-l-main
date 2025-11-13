import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Calculator, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ProfitCalculation {
  id: number
  trip_id: string
  booking_reference: string
  customer_name: string
  total_revenue: number
  total_expenses: number
  total_vendor_payouts: number
  gross_profit: number
  profit_margin: number
  calculation_date: string
  status: string
  notes: string
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Profit Calculation Master Component
 * 
 * Integrations:
 * 1. Auto-calculates from Expense Tracking Master (sum of expenses per trip)
 * 2. Auto-calculates from Vendor Payout Master (sum of payouts per trip)
 * 3. Reports & Dashboard display profit analysis
 * 
 * Features:
 * - Calculates total cost and margin per trip
 * - Auto-sums expenses and vendor payouts by trip_id
 * - Profit margin percentage calculation
 * - Draft and Finalized status tracking
 */
const ProfitCalculationMaster: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [calculations, setCalculations] = useState<ProfitCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingCalculation, setEditingCalculation] = useState<ProfitCalculation | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const [formData, setFormData] = useState({
    tripId: '',
    bookingReference: '',
    customerName: '',
    totalRevenue: 0,
    autoCalculate: true,
    status: 'Draft',
    notes: ''
  })

  useEffect(() => {
    fetchCalculations()
  }, [filterStatus])

  const fetchCalculations = async () => {
    try {
      setLoading(true)
      const url = filterStatus === 'all' 
        ? '/api/profit-calculation' 
        : `/api/profit-calculation?status=${filterStatus}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setCalculations(data.profitCalculations || [])
      }
    } catch (error) {
      console.error('Error fetching profit calculations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        trip_id: formData.tripId,
        booking_reference: formData.bookingReference,
        customer_name: formData.customerName,
        total_revenue: formData.totalRevenue,
        auto_calculate: formData.autoCalculate,
        status: formData.status,
        notes: formData.notes,
        created_by: 'Admin'
      }

      const url = '/api/profit-calculation'
      const method = editingCalculation ? 'PUT' : 'POST'
      const body = editingCalculation ? { ...payload, id: editingCalculation.id } : payload

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchCalculations()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to save profit calculation: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Error saving profit calculation:', error)
      alert('Failed to save profit calculation')
    } finally {
      setSaving(false)
    }
  }

  const handleRecalculate = async (calculation: ProfitCalculation) => {
    try {
      const response = await fetch('/api/profit-calculation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: calculation.id,
          trip_id: calculation.trip_id,
          total_revenue: calculation.total_revenue,
          auto_calculate: true
        })
      })

      if (response.ok) {
        await fetchCalculations()
        alert('Profit calculation updated successfully')
      }
    } catch (error) {
      console.error('Error recalculating profit:', error)
      alert('Failed to recalculate profit')
    }
  }

  const handleEdit = (calculation: ProfitCalculation) => {
    setEditingCalculation(calculation)
    setFormData({
      tripId: calculation.trip_id,
      bookingReference: calculation.booking_reference || '',
      customerName: calculation.customer_name || '',
      totalRevenue: calculation.total_revenue,
      autoCalculate: false,
      status: calculation.status || 'Draft',
      notes: calculation.notes || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this profit calculation?')) return

    try {
      const response = await fetch(`/api/profit-calculation?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCalculations()
      } else {
        alert('Failed to delete profit calculation')
      }
    } catch (error) {
      console.error('Error deleting profit calculation:', error)
      alert('Failed to delete profit calculation')
    }
  }

  const resetForm = () => {
    setFormData({
      tripId: '',
      bookingReference: '',
      customerName: '',
      totalRevenue: 0,
      autoCalculate: true,
      status: 'Draft',
      notes: ''
    })
    setEditingCalculation(null)
    setShowAddForm(false)
  }

  const filteredCalculations = calculations.filter(calc =>
    calc.trip_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const calculateSummary = () => {
    const totalRevenue = calculations.reduce((sum, c) => sum + c.total_revenue, 0)
    const totalExpenses = calculations.reduce((sum, c) => sum + c.total_expenses, 0)
    const totalPayouts = calculations.reduce((sum, c) => sum + c.total_vendor_payouts, 0)
    const totalProfit = calculations.reduce((sum, c) => sum + c.gross_profit, 0)
    const avgMargin = calculations.length > 0 
      ? calculations.reduce((sum, c) => sum + c.profit_margin, 0) / calculations.length 
      : 0

    return { totalRevenue, totalExpenses, totalPayouts, totalProfit, avgMargin }
  }

  const summary = calculateSummary()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  if (showAddForm) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={resetForm} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profit Calculations
        </Button>

        <h2 className="text-2xl font-bold mb-6">
          {editingCalculation ? 'Edit Profit Calculation' : 'Add New Profit Calculation'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip ID *
              </label>
              <Input
                type="text"
                required
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
                Customer Name
              </label>
              <Input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                placeholder="Customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Revenue * (₹)
              </label>
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.totalRevenue}
                onChange={(e) => setFormData({...formData, totalRevenue: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="Draft">Draft</option>
                <option value="Finalized">Finalized</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.autoCalculate}
                  onChange={(e) => setFormData({...formData, autoCalculate: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  Auto-calculate from expenses & payouts
                </span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes or remarks"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
              {saving ? 'Saving...' : (editingCalculation ? 'Update' : 'Create')}
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
              <Calculator className="mr-2 h-6 w-6" />
              Profit Calculation Master
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Calculate total cost, margin, and profit for each trip
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Calculation
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Expenses</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Vendor Payouts</div>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalPayouts)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Profit</div>
            <div className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.totalProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Avg Margin</div>
            <div className={`text-2xl font-bold ${summary.avgMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(summary.avgMargin)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by trip ID, customer, or booking reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-md"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Finalized">Finalized</option>
        </select>
      </div>

      {/* Calculations List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading profit calculations...</p>
        </div>
      ) : filteredCalculations.length === 0 ? (
        <div className="text-center py-12">
          <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No profit calculations found. Add your first calculation!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCalculations.map((calculation) => (
            <Card key={calculation.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{calculation.trip_id}</h3>
                      <Badge variant="outline">{calculation.status}</Badge>
                      {calculation.gross_profit >= 0 ? (
                        <Badge className="bg-green-500 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Profitable
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          Loss
                        </Badge>
                      )}
                    </div>

                    {calculation.customer_name && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Customer:</span> {calculation.customer_name}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Revenue:</span>
                        <div className="font-semibold text-blue-600">{formatCurrency(calculation.total_revenue)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Expenses:</span>
                        <div className="font-semibold text-red-600">{formatCurrency(calculation.total_expenses)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Payouts:</span>
                        <div className="font-semibold text-orange-600">{formatCurrency(calculation.total_vendor_payouts)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Profit:</span>
                        <div className={`font-semibold ${calculation.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(calculation.gross_profit)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Margin:</span>
                        <div className={`font-semibold ${calculation.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(calculation.profit_margin)}
                        </div>
                      </div>
                    </div>

                    {calculation.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">{calculation.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRecalculate(calculation)}
                      title="Recalculate from expenses & payouts"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(calculation)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(calculation.id)} className="text-red-600">
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

export default ProfitCalculationMaster

