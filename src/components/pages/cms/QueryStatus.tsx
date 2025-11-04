import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QueryStatus {
  id: number
  name: string
  color: string
  display_order?: number
  stage_type?: string
  category?: string
  default_automation?: string[]
  stage_behaviour?: string
  visibility_level?: string[]
  take_note?: boolean
  lock_status?: boolean
  dashboard?: boolean
  notes?: string
  status: string
  created_by: string
  date: string
}

const QueryStatus: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [queryStatuses, setQueryStatuses] = useState<QueryStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingStatus, setEditingStatus] = useState<QueryStatus | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    displayOrder: 0,
    stageType: '',
    category: '',
    defaultAutomation: [] as string[],
    stageBehaviour: 'Manual',
    visibilityLevel: [] as string[],
    takeNote: false,
    lockStatus: false,
    dashboard: false,
    notes: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchQueryStatuses()
  }, [])

  const fetchQueryStatuses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/query-statuses')
      const data = await response.json()
      
      if (response.ok) {
        const statuses = (data.queryStatuses || []).map((qs: any) => ({
          id: qs.id,
          name: qs.name,
          color: qs.color,
          display_order: qs.display_order || qs.displayOrder || 0,
          stage_type: qs.stage_type || qs.stageType || '',
          category: qs.category || '',
          default_automation: qs.default_automation || qs.defaultAutomation || [],
          stage_behaviour: qs.stage_behaviour || qs.stageBehaviour || 'Manual',
          visibility_level: qs.visibility_level || qs.visibilityLevel || [],
          take_note: qs.take_note || qs.takeNote || false,
          lock_status: qs.lock_status || qs.lockStatus || false,
          dashboard: qs.dashboard || false,
          notes: qs.notes || '',
          status: qs.status || 'Active',
          created_by: qs.created_by,
          date: qs.date
        }))
        // Sort by display order
        statuses.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        setQueryStatuses(statuses)
      } else {
        console.error('Failed to fetch query statuses:', data.error)
      }
    } catch (error) {
      console.error('Error fetching query statuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStatus = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a status name')
      return
    }

    try {
      setSaving(true)
      const method = editingStatus ? 'PUT' : 'POST'
      const body = editingStatus 
        ? { 
            id: editingStatus.id, 
            ...formData,
            displayOrder: formData.displayOrder,
            stageType: formData.stageType,
            category: formData.category,
            defaultAutomation: formData.defaultAutomation,
            stageBehaviour: formData.stageBehaviour,
            visibilityLevel: formData.visibilityLevel
          }
        : {
            ...formData,
            displayOrder: formData.displayOrder,
            stageType: formData.stageType,
            category: formData.category,
            defaultAutomation: formData.defaultAutomation,
            stageBehaviour: formData.stageBehaviour,
            visibilityLevel: formData.visibilityLevel
          }

      const response = await fetch('/api/query-statuses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchQueryStatuses()
        setShowAddForm(false)
        setFormData({ 
          name: '', 
          color: '#3B82F6', 
          displayOrder: 0,
          stageType: '',
          category: '',
          defaultAutomation: [],
          stageBehaviour: 'Manual',
          visibilityLevel: [],
          takeNote: false, 
          lockStatus: false, 
          dashboard: false,
          notes: '',
          status: 'Active' 
        })
        setEditingStatus(null)
        alert(data.message || 'Query status saved successfully')
      } else {
        alert(data.error || 'Failed to save query status')
      }
    } catch (error) {
      console.error('Error saving query status:', error)
      alert('Error saving query status')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStatus = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/query-statuses?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchQueryStatuses()
        alert(data.message || 'Query status deleted successfully')
      } else {
        alert(data.error || 'Failed to delete query status')
      }
    } catch (error) {
      console.error('Error deleting query status:', error)
      alert('Error deleting query status')
    }
  }

  const handleEditClick = (queryStatus: QueryStatus) => {
    setEditingStatus(queryStatus)
    setFormData({
      name: queryStatus.name,
      color: queryStatus.color || '#3B82F6',
      displayOrder: queryStatus.display_order || 0,
      stageType: queryStatus.stage_type || '',
      category: queryStatus.category || '',
      defaultAutomation: queryStatus.default_automation || [],
      stageBehaviour: queryStatus.stage_behaviour || 'Manual',
      visibilityLevel: queryStatus.visibility_level || [],
      takeNote: queryStatus.take_note || false,
      lockStatus: queryStatus.lock_status || false,
      dashboard: queryStatus.dashboard || false,
      notes: queryStatus.notes || '',
      status: queryStatus.status || 'Active'
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingStatus(null)
    setFormData({ 
      name: '', 
      color: '#3B82F6', 
      displayOrder: 0,
      stageType: '',
      category: '',
      defaultAutomation: [],
      stageBehaviour: 'Manual',
      visibilityLevel: [],
      takeNote: false, 
      lockStatus: false, 
      dashboard: false,
      notes: '',
      status: 'Active' 
    })
  }

  const filteredStatuses = queryStatuses.filter(qs =>
    qs.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading query statuses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-lg font-bold text-gray-900">Query Status</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  type="text"
                  placeholder="Search by name"
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
              Add Status
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th className="w-40 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage Type</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Behaviour</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStatuses.map((queryStatus) => (
                    <tr key={queryStatus.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {queryStatus.display_order || 0}
                      </td>
                      <td className="px-3 py-4">
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: queryStatus.color || '#3B82F6' }}
                        />
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">
                        {queryStatus.name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {queryStatus.stage_type || '-'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Badge 
                          variant="success" 
                          className={`${
                            queryStatus.category === 'Won' ? 'bg-green-600' :
                            queryStatus.category === 'Lost' ? 'bg-red-600' :
                            'bg-blue-600'
                          } text-white`}
                        >
                          {queryStatus.category || '-'}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {queryStatus.stage_behaviour || '-'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {(queryStatus.visibility_level || []).join(', ') || '-'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Badge variant="success" className="bg-green-600 text-white">
                          {queryStatus.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEditClick(queryStatus)}
                            className="hover:text-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteStatus(queryStatus.id, queryStatus.name)}
                            className="hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-sm text-gray-600">
          Total Records: {filteredStatuses.length}
        </div>
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
                  {editingStatus ? 'Edit Query Status' : 'Add Query Status'}
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
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-red-500 rounded-l-sm"></div>
                      <Input 
                        type="text" 
                        className="pl-3.5"
                        placeholder="e.g., New, Contacted, Quoted, Confirmed"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Order
                      </label>
                      <Input 
                        type="number" 
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})}
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Lower number appears first</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color Code
                      </label>
                      <Input 
                        type="color" 
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stage Type
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.stageType}
                      onChange={(e) => setFormData({...formData, stageType: e.target.value})}
                    >
                      <option value="">Select Stage Type</option>
                      <option value="Sales">Sales</option>
                      <option value="Operations">Operations</option>
                      <option value="Post-Trip">Post-Trip</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      <option value="Open">Open</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stage Behaviour
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.stageBehaviour}
                      onChange={(e) => setFormData({...formData, stageBehaviour: e.target.value})}
                    >
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Automation
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {['WhatsApp', 'Email', 'Reminder'].map(auto => {
                        const checked = formData.defaultAutomation.includes(auto)
                        return (
                          <label key={auto} className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({...formData, defaultAutomation: [...formData.defaultAutomation, auto]})
                                } else {
                                  setFormData({...formData, defaultAutomation: formData.defaultAutomation.filter(a => a !== auto)})
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700">{auto}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibility Level
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {['Admin', 'Sales', 'Operations'].map(level => {
                        const checked = formData.visibilityLevel.includes(level)
                        return (
                          <label key={level} className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({...formData, visibilityLevel: [...formData.visibilityLevel, level]})
                                } else {
                                  setFormData({...formData, visibilityLevel: formData.visibilityLevel.filter(l => l !== level)})
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700">{level}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={formData.takeNote}
                        onChange={(e) => setFormData({...formData, takeNote: e.target.checked})}
                      />
                      <span className="text-sm font-medium text-gray-700">Take Note</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={formData.lockStatus}
                        onChange={(e) => setFormData({...formData, lockStatus: e.target.checked})}
                      />
                      <span className="text-sm font-medium text-gray-700">Lock Status</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={formData.dashboard}
                        onChange={(e) => setFormData({...formData, dashboard: e.target.checked})}
                      />
                      <span className="text-sm font-medium text-gray-700">Show on Dashboard</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Internal workflow comments)
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Enter internal workflow comments"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
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
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseForm}
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveStatus}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingStatus ? 'Update' : 'Save')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QueryStatus
