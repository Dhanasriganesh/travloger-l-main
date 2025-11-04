import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Calculator } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PricingTaxRule {
  id: number
  name: string
  rate_type: string
  linked_module: string
  markup_type: string
  markup_value: number
  tax_type: string
  tax_percentage: number
  calculation_formula?: string
  season_start_date?: string | null
  season_end_date?: string | null
  notes?: string
  status: string
  created_by: string
  date: string
}

const PricingTaxRule: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [pricingRules, setPricingRules] = useState<PricingTaxRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingTaxRule | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    rateType: '',
    linkedModule: '',
    markupType: '',
    markupValue: 0,
    taxType: '',
    taxPercentage: 0,
    seasonStartDate: '',
    seasonEndDate: '',
    notes: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchPricingRules()
  }, [])

  // Calculate formula based on current values
  const calculateFormula = () => {
    const base = 'Base'
    const markup = formData.markupType === 'Percentage' 
      ? `${formData.markupValue}%` 
      : `+${formData.markupValue}`
    const tax = formData.taxType !== 'None' 
      ? `+${formData.taxPercentage}%` 
      : ''
    return `${base} ${formData.markupType === 'Percentage' ? '+' : ''} ${markup} ${tax}`.trim()
  }

  const fetchPricingRules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pricing-tax-rules')
      const data = await response.json()
      
      if (response.ok) {
        setPricingRules(data.pricingRules || [])
      } else {
        console.error('Failed to fetch pricing rules:', data.error)
      }
    } catch (error) {
      console.error('Error fetching pricing rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRule = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a pricing rule name')
      return
    }
    if (!formData.rateType) {
      alert('Please select a rate type')
      return
    }
    if (!formData.linkedModule) {
      alert('Please select a linked module')
      return
    }
    if (!formData.markupType) {
      alert('Please select a markup type')
      return
    }
    if (formData.markupValue < 0) {
      alert('Markup value cannot be negative')
      return
    }
    if (!formData.taxType) {
      alert('Please select a tax type')
      return
    }
    if (formData.taxType !== 'None' && formData.taxPercentage < 0) {
      alert('Tax percentage cannot be negative')
      return
    }

    try {
      setSaving(true)
      const method = editingRule ? 'PUT' : 'POST'
      const body = {
        ...(editingRule ? { id: editingRule.id } : {}),
        name: formData.name.trim(),
        rateType: formData.rateType,
        linkedModule: formData.linkedModule,
        markupType: formData.markupType,
        markupValue: formData.markupValue,
        taxType: formData.taxType,
        taxPercentage: formData.taxType !== 'None' ? formData.taxPercentage : 0,
        calculationFormula: calculateFormula(),
        seasonStartDate: formData.seasonStartDate || null,
        seasonEndDate: formData.seasonEndDate || null,
        notes: formData.notes || '',
        status: formData.status
      }

      const response = await fetch('/api/pricing-tax-rules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPricingRules()
        setShowAddForm(false)
        setFormData({
          name: '',
          rateType: '',
          linkedModule: '',
          markupType: '',
          markupValue: 0,
          taxType: '',
          taxPercentage: 0,
          seasonStartDate: '',
          seasonEndDate: '',
          notes: '',
          status: 'Active'
        })
        setEditingRule(null)
        alert(data.message || 'Pricing rule saved successfully')
      } else {
        alert(data.error || 'Failed to save pricing rule')
      }
    } catch (error) {
      console.error('Error saving pricing rule:', error)
      alert('Error saving pricing rule')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRule = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/pricing-tax-rules?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPricingRules()
        alert(data.message || 'Pricing rule deleted successfully')
      } else {
        alert(data.error || 'Failed to delete pricing rule')
      }
    } catch (error) {
      console.error('Error deleting pricing rule:', error)
      alert('Error deleting pricing rule')
    }
  }

  const handleEditClick = (rule: PricingTaxRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      rateType: rule.rate_type,
      linkedModule: rule.linked_module,
      markupType: rule.markup_type,
      markupValue: rule.markup_value,
      taxType: rule.tax_type,
      taxPercentage: rule.tax_percentage,
      seasonStartDate: rule.season_start_date ? (rule.season_start_date.includes('T') ? rule.season_start_date.split('T')[0] : rule.season_start_date) : '',
      seasonEndDate: rule.season_end_date ? (rule.season_end_date.includes('T') ? rule.season_end_date.split('T')[0] : rule.season_end_date) : '',
      notes: rule.notes || '',
      status: rule.status
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingRule(null)
    setFormData({
      name: '',
      rateType: '',
      linkedModule: '',
      markupType: '',
      markupValue: 0,
      taxType: '',
      taxPercentage: 0,
      seasonStartDate: '',
      seasonEndDate: '',
      notes: '',
      status: 'Active'
    })
  }

  const filteredRules = pricingRules.filter(rule =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.linked_module.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading pricing rules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings/admin')}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span className="text-xs">Back to Admin Settings</span>
              </button>
              <h1 className="text-lg font-bold text-gray-900">Pricing & Tax Rule</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  type="text"
                  placeholder="Search by name or module"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-40 h-8"
                />
              </div>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-sm"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Pricing Rule
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Type</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Markup</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRules.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'No pricing rules found matching your search' : 'No pricing rules found. Click "Add Pricing Rule" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-900">{rule.name}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{rule.rate_type}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{rule.linked_module}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {rule.markup_type === 'Percentage' ? `${rule.markup_value}%` : `₹${rule.markup_value}`}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {rule.tax_type === 'None' ? 'None' : `${rule.tax_type} ${rule.tax_percentage}%`}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant={rule.status === 'Active' ? 'default' : 'secondary'}>
                            {rule.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500">{rule.date}</td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(rule)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id, rule.name)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            onClick={handleCloseForm}
          />
          
          <div className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingRule ? 'Edit Pricing & Tax Rule' : 'Add Pricing & Tax Rule'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pricing Rule Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter pricing rule name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rate Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.rateType}
                        onChange={(e) => setFormData({...formData, rateType: e.target.value})}
                      >
                        <option value="">Select rate type</option>
                        <option value="Flat">Flat</option>
                        <option value="Per Person">Per Person</option>
                        <option value="Per Vehicle">Per Vehicle</option>
                        <option value="Seasonal">Seasonal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Linked Module <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.linkedModule}
                        onChange={(e) => setFormData({...formData, linkedModule: e.target.value})}
                      >
                        <option value="">Select module</option>
                        <option value="Hotel">Hotel</option>
                        <option value="Vehicle">Vehicle</option>
                        <option value="Activity">Activity</option>
                        <option value="Package">Package</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Markup Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.markupType}
                        onChange={(e) => setFormData({...formData, markupType: e.target.value})}
                      >
                        <option value="">Select markup type</option>
                        <option value="Percentage">Percentage</option>
                        <option value="Fixed">Fixed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Markup Value <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter markup value"
                        value={formData.markupValue}
                        onChange={(e) => setFormData({...formData, markupValue: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.taxType}
                        onChange={(e) => setFormData({...formData, taxType: e.target.value, taxPercentage: e.target.value === 'None' ? 0 : formData.taxPercentage})}
                      >
                        <option value="">Select tax type</option>
                        <option value="GST">GST</option>
                        <option value="Service Tax">Service Tax</option>
                        <option value="None">None</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Percentage <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter tax percentage"
                        value={formData.taxPercentage}
                        onChange={(e) => setFormData({...formData, taxPercentage: parseFloat(e.target.value) || 0})}
                        disabled={formData.taxType === 'None'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calculation Formula (Auto-generated)
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
                      <Calculator className="inline h-4 w-4 mr-2" />
                      {calculateFormula()}
                    </div>
                  </div>

                  {(formData.rateType === 'Seasonal' || formData.seasonStartDate) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Season Start Date (Optional)
                        </label>
                        <Input
                          type="date"
                          value={formData.seasonStartDate}
                          onChange={(e) => setFormData({...formData, seasonStartDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Season End Date (Optional)
                        </label>
                        <Input
                          type="date"
                          value={formData.seasonEndDate}
                          onChange={(e) => setFormData({...formData, seasonEndDate: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Internal or developer reference notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
                <Button
                  onClick={handleCloseForm}
                  variant="outline"
                  className="text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRule}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : editingRule ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PricingTaxRule

