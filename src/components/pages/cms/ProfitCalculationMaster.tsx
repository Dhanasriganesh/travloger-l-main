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
 * 1. Links to Pricing & Tax Rule Master for sales valuation inputs
 * 2. Auto-calculates from Expense Tracking Master (sum of expenses per trip)
 * 3. Auto-calculates from Vendor Payout Master (sum of payouts per trip)
 * 4. Reports & Dashboard display profit analysis
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
    totalSalesValue: 0,
    totalExpenses: 0,
    vendorPayouts: 0,
    autoCalculate: true,
    status: 'Draft',
    notes: ''
  })

  useEffect(() => {
    fetchCalculations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        total_revenue: formData.totalSalesValue,
        total_expenses: formData.totalExpenses,
        total_vendor_payouts: formData.vendorPayouts,
        gross_profit: formData.totalSalesValue - formData.totalExpenses - formData.vendorPayouts,
        profit_margin: formData.totalSalesValue > 0
          ? ((formData.totalSalesValue - formData.totalExpenses - formData.vendorPayouts) / formData.totalSalesValue) * 100
          : 0,
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
      totalSalesValue: calculation.total_revenue,
      totalExpenses: calculation.total_expenses,
      vendorPayouts: calculation.total_vendor_payouts,
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
      totalSalesValue: 0,
      totalExpenses: 0,
      vendorPayouts: 0,
      autoCalculate: true,
      status: 'Draft',
      notes: ''
    })
    setEditingCalculation(null)
    setShowAddForm(false)
  }

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

  const computedNetProfit =
    formData.totalSalesValue - formData.totalExpenses - formData.vendorPayouts
  const computedMargin =
    formData.totalSalesValue > 0 ? (computedNetProfit / formData.totalSalesValue) * 100 : 0

  const normalizedSearch = searchTerm.toLowerCase()
  const filteredCalculations = calculations.filter((calc) => {
    const revenueString = formatCurrency(calc.total_revenue).toLowerCase()
    const profitString = formatCurrency(calc.gross_profit).toLowerCase()
    return (
      calc.trip_id?.toLowerCase().includes(normalizedSearch) ||
      revenueString.includes(normalizedSearch) ||
      profitString.includes(normalizedSearch)
    )
  })

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
                Total Sales Value * (₹)
              </label>
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.totalSalesValue}
                onChange={(e) => setFormData({...formData, totalSalesValue: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Expense Value (₹)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.totalExpenses}
                onChange={(e) => setFormData({...formData, totalExpenses: parseFloat(e.target.value) || 0})}
                disabled={formData.autoCalculate}
              />
              {formData.autoCalculate && (
                <p className="text-xs text-gray-500 mt-1">Auto-filled from Expense Tracking Master</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Payouts (₹)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.vendorPayouts}
                onChange={(e) => setFormData({...formData, vendorPayouts: parseFloat(e.target.value) || 0})}
                disabled={formData.autoCalculate}
              />
              {formData.autoCalculate && (
                <p className="text-xs text-gray-500 mt-1">Auto-filled from Vendor Payout Master</p>
              )}
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
                  Auto-calculate from Pricing &amp; Tax, Expenses &amp; Payouts
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Net Profit (₹)
              </label>
              <Input
                type="number"
                value={Number.isFinite(computedNetProfit) ? parseFloat(computedNetProfit.toFixed(2)) : 0}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Margin (%)
              </label>
              <Input
                type="number"
                value={Number.isFinite(computedMargin) ? parseFloat(computedMargin.toFixed(2)) : 0}
                readOnly
              />
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
              Calculate per-trip profit using sales value minus expenses and vendor payouts
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Connected to Pricing &amp; Tax Rule Master, Expense Tracking Master, Vendor Payout Master, and Reports &amp; Dashboard.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Calculation
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/pricing-tax-rule')}>
            View Pricing &amp; Tax Rule Master
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/expense-tracking-master')}>
            View Expense Tracking Master
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/vendor-payout-master')}>
            View Vendor Payout Master
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
            View Reports &amp; Dashboard
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Sales Value</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Expense Value</div>
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
            <div className="text-sm text-gray-600">Net Profit</div>
            <div className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.totalProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Avg Margin (%)</div>
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
            placeholder="Search by trip ID, sales value, or profit..."
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

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Sales Value:</span>
                        <div className="font-semibold text-blue-600">{formatCurrency(calculation.total_revenue)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Expense Value:</span>
                        <div className="font-semibold text-red-600">{formatCurrency(calculation.total_expenses)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Payouts:</span>
                        <div className="font-semibold text-orange-600">{formatCurrency(calculation.total_vendor_payouts)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Net Profit:</span>
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

