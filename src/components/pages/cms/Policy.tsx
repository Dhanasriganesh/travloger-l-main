import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Policy {
  id: number
  name: string
  policy_type: string
  description: string
  linked_module: string
  editable_by: string
  version: string
  effective_date?: string | null
  notes?: string
  status: string
  created_by: string
  date: string
}

const Policy: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    policyType: '',
    description: '',
    linkedModule: '',
    editableBy: '',
    version: '1.0',
    effectiveDate: '',
    notes: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/policies')
      const data = await response.json()
      
      if (response.ok) {
        setPolicies(data.policies || [])
      } else {
        console.error('Failed to fetch policies:', data.error)
      }
    } catch (error) {
      console.error('Error fetching policies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePolicy = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a policy name')
      return
    }
    if (!formData.policyType) {
      alert('Please select a policy type')
      return
    }
    if (!formData.description.trim()) {
      alert('Please enter a policy description')
      return
    }
    if (!formData.linkedModule) {
      alert('Please select a linked module')
      return
    }
    if (!formData.editableBy) {
      alert('Please select who can edit this policy')
      return
    }
    if (!formData.version.trim()) {
      alert('Please enter a version number')
      return
    }

    try {
      setSaving(true)
      const method = editingPolicy ? 'PUT' : 'POST'
      const body = {
        ...(editingPolicy ? { id: editingPolicy.id } : {}),
        name: formData.name.trim(),
        policyType: formData.policyType,
        description: formData.description.trim(),
        linkedModule: formData.linkedModule,
        editableBy: formData.editableBy,
        version: formData.version.trim(),
        effectiveDate: formData.effectiveDate || null,
        notes: formData.notes || '',
        status: formData.status
      }

      const response = await fetch('/api/policies', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPolicies()
        setShowAddForm(false)
        setFormData({
          name: '',
          policyType: '',
          description: '',
          linkedModule: '',
          editableBy: '',
          version: '1.0',
          effectiveDate: '',
          notes: '',
          status: 'Active'
        })
        setEditingPolicy(null)
        alert(data.message || 'Policy saved successfully')
      } else {
        alert(data.error || 'Failed to save policy')
      }
    } catch (error) {
      console.error('Error saving policy:', error)
      alert('Error saving policy')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePolicy = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/policies?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPolicies()
        alert(data.message || 'Policy deleted successfully')
      } else {
        alert(data.error || 'Failed to delete policy')
      }
    } catch (error) {
      console.error('Error deleting policy:', error)
      alert('Error deleting policy')
    }
  }

  const handleEditClick = (policy: Policy) => {
    setEditingPolicy(policy)
    setFormData({
      name: policy.name,
      policyType: policy.policy_type,
      description: policy.description,
      linkedModule: policy.linked_module,
      editableBy: policy.editable_by,
      version: policy.version,
      effectiveDate: policy.effective_date ? (policy.effective_date.includes('T') ? policy.effective_date.split('T')[0] : policy.effective_date) : '',
      notes: policy.notes || '',
      status: policy.status
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingPolicy(null)
    setFormData({
      name: '',
      policyType: '',
      description: '',
      linkedModule: '',
      editableBy: '',
      version: '1.0',
      effectiveDate: '',
      notes: '',
      status: 'Active'
    })
  }

  const filteredPolicies = policies.filter(policy =>
    policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.policy_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading policies...</p>
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
              <h1 className="text-lg font-bold text-gray-900">Policy</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  type="text"
                  placeholder="Search by name or type"
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
              Add Policy
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
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'No policies found matching your search' : 'No policies found. Click "Add Policy" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPolicies.map((policy) => (
                      <tr key={policy.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-900">{policy.name}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{policy.policy_type}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{policy.linked_module}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{policy.version}</td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant={policy.status === 'Active' ? 'default' : 'secondary'}>
                            {policy.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500">{policy.date}</td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(policy)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePolicy(policy.id, policy.name)}
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
                  {editingPolicy ? 'Edit Policy' : 'Add Policy'}
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
                      Policy Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Cancellation Policy, Payment Policy"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Policy Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.policyType}
                        onChange={(e) => setFormData({...formData, policyType: e.target.value})}
                      >
                        <option value="">Select policy type</option>
                        <option value="Booking">Booking</option>
                        <option value="Payment">Payment</option>
                        <option value="Cancellation">Cancellation</option>
                        <option value="Post-Trip">Post-Trip</option>
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
                        <option value="Itinerary">Itinerary</option>
                        <option value="Booking">Booking</option>
                        <option value="Voucher">Voucher</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Policy Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={8}
                      placeholder="Enter full policy text or terms..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Editable By <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.editableBy}
                        onChange={(e) => setFormData({...formData, editableBy: e.target.value})}
                      >
                        <option value="">Select editor</option>
                        <option value="Admin">Admin</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Version <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., 1.0, 2.1"
                        value={formData.version}
                        onChange={(e) => setFormData({...formData, version: e.target.value})}
                      />
                      <p className="text-xs text-gray-500 mt-1">Track policy revisions</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Effective Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Activation date of this policy</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Internal or workflow reference notes"
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
                  onClick={handleSavePolicy}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : editingPolicy ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Policy

