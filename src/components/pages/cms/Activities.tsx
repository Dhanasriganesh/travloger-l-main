import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Download, Upload, FileDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Activity {
  id: number
  name: string
  destination: string
  supplier_id?: number
  type?: string
  duration?: string
  inclusions?: string
  exclusions?: string
  price: number
  cost_type?: string
  operating_days?: string
  time_slots?: string[]
  gallery?: string[]
  notes?: string
  status: string
  created_by: string
  date: string
}

const Activities: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    supplierId: '' as any,
    type: '',
    duration: '',
    inclusions: '',
    exclusions: '',
    price: 0,
    costType: 'per_person',
    operatingDays: '',
    timeSlots: '' as string,
    gallery: [] as string[],
    notes: '',
    status: 'Active'
  })
  
  const [destinations, setDestinations] = useState<string[]>([])
  const [destinationInput, setDestinationInput] = useState('')
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const [suppliers, setSuppliers] = useState<{id:number, name:string, city:string}[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  useEffect(() => {
    fetchActivities()
    fetchDestinations()
    fetchSuppliers()
  }, [])
  
  const filteredSuppliers = useMemo(() => {
    const target = formData.destination || destinationInput
    if (!target) return suppliers
    return suppliers.filter(s => (s.city || '').toLowerCase() === target.toLowerCase())
  }, [suppliers, formData.destination, destinationInput])
  
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      const data = await response.json()
      if (response.ok) {
        setSuppliers((data.suppliers || []).map((s: any) => ({ id: s.id, name: s.company_name, city: s.city })))
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchDestinations = async () => {
    try {
      const response = await fetch('/api/destinations')
      const data = await response.json()
      
      if (response.ok) {
        setDestinations(data.destinations?.map((d: any) => d.name) || [])
      }
    } catch (error) {
      console.error('Error fetching destinations:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/activities')
      const data = await response.json()
      
      if (response.ok) {
        setActivities(data.activities || [])
      } else {
        console.error('Failed to fetch activities:', data.error)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveActivity = async () => {
    if (!formData.name.trim() || !formData.destination.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const method = editingActivity ? 'PUT' : 'POST'
      const body = editingActivity 
        ? { id: editingActivity.id, ...formData, supplierId: formData.supplierId ? Number(formData.supplierId) : null, timeSlots: formData.timeSlots ? formData.timeSlots.split(',').map(s => s.trim()).filter(Boolean) : [], gallery: formData.gallery }
        : { ...formData, supplierId: formData.supplierId ? Number(formData.supplierId) : null, timeSlots: formData.timeSlots ? formData.timeSlots.split(',').map(s => s.trim()).filter(Boolean) : [], gallery: formData.gallery }

      const response = await fetch('/api/activities', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchActivities() // Refresh the list
        setShowAddForm(false)
        setFormData({ name: '', destination: '', supplierId: '', type: '', duration: '', inclusions: '', exclusions: '', price: 0, costType: 'per_person', operatingDays: '', timeSlots: '', gallery: [], notes: '', status: 'Active' })
        setEditingActivity(null)
        alert(data.message || 'Activity saved successfully')
      } else {
        alert(data.error || 'Failed to save activity')
      }
    } catch (error) {
      console.error('Error saving activity:', error)
      alert('Error saving activity')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteActivity = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/activities?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchActivities() // Refresh the list
        alert(data.message || 'Activity deleted successfully')
      } else {
        alert(data.error || 'Failed to delete activity')
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
      alert('Error deleting activity')
    }
  }

  const handleEditClick = (activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      name: activity.name,
      destination: activity.destination,
      supplierId: activity.supplier_id || '',
      type: activity.type || '',
      duration: activity.duration || '',
      inclusions: activity.inclusions || '',
      exclusions: activity.exclusions || '',
      price: activity.price,
      costType: activity.cost_type || 'per_person',
      operatingDays: activity.operating_days || '',
      timeSlots: Array.isArray(activity.time_slots) ? activity.time_slots.join(', ') : '',
      gallery: activity.gallery || [],
      notes: activity.notes || '',
      status: activity.status
    })
    setDestinationInput(activity.destination || '')
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingActivity(null)
    setFormData({ name: '', destination: '', supplierId: '', type: '', duration: '', inclusions: '', exclusions: '', price: 0, costType: 'per_person', operatingDays: '', timeSlots: '', gallery: [], notes: '', status: 'Active' })
    setDestinationInput('')
    setShowDestinationSuggestions(false)
    setSelectedFiles([])
  }

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.destination.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading activities...</p>
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
              <h1 className="text-lg font-bold text-gray-900">Activity</h1>
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="text-gray-700 bg-white hover:bg-gray-50 px-2 py-1 text-sm"
              >
                <Download className="w-3 h-3 mr-1" />
                Download Format
              </Button>
              <Button
                variant="outline"
                className="text-gray-700 bg-white hover:bg-gray-50 px-2 py-1 text-sm"
              >
                <Upload className="w-3 h-3 mr-1" />
                Import CSV
              </Button>
              <Button
                variant="outline"
                className="text-gray-700 bg-white hover:bg-gray-50 px-2 py-1 text-sm"
              >
                <FileDown className="w-3 h-3 mr-1" />
                Export Data
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Activity
              </Button>
            </div>
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
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">
                        {activity.name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {activity.destination}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <button className="text-blue-600 hover:text-blue-800 underline">
                          ₹{activity.price}
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Badge variant="success" className="bg-green-600 text-white">
                          {activity.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          <span className="text-xs truncate">{activity.created_by}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {activity.date}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditClick(activity)}
                          className="hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleDeleteActivity(activity.id, activity.name)}
                          className="hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Total Records */}
        <div className="mt-4 text-sm text-gray-600">
          Total Records: {filteredActivities.length}
        </div>
      </div>

      {/* Add Activity Form Panel */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          />
          
          {/* Sliding Panel */}
          <div className="absolute right-0 top-0 h-full w-[500px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingActivity ? 'Edit Activity' : 'Add Activity'}
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

              {/* Form */}
              <div className="flex-1 p-6 overflow-y-auto">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity name
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-red-500 rounded-l-sm"></div>
                      <Input 
                        type="text" 
                        className="pl-3.5"
                        placeholder="Enter activity name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input 
                        type="text" 
                        placeholder="Type to search destinations..."
                        value={destinationInput}
                        onChange={(e) => {
                          setDestinationInput(e.target.value)
                          setShowDestinationSuggestions(true)
                        }}
                        onFocus={() => setShowDestinationSuggestions(true)}
                        className="border-l-2 border-red-500"
                      />
                      
                      {showDestinationSuggestions && destinationInput && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {destinations
                            .filter(d => d.toLowerCase().includes(destinationInput.toLowerCase()))
                            .map((destination, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                                onClick={() => {
                                  setFormData({...formData, destination: destination, supplierId: ''})
                                  setDestinationInput(destination)
                                  setShowDestinationSuggestions(false)
                                }}
                              >
                                {destination}
                              </button>
                            ))}
                          {destinations.filter(d => d.toLowerCase().includes(destinationInput.toLowerCase())).length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-500">No destinations found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linked Supplier</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.supplierId}
                      onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                    >
                      <option value="">Select supplier</option>
                      {filteredSuppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="">Select type</option>
                      <option value="Sightseeing">Sightseeing</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Cruise">Cruise</option>
                      <option value="Entry Ticket">Entry Ticket</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <Input 
                      type="text" 
                      placeholder="e.g., 2 hours, Half Day, Full Day"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inclusions</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="What's included"
                      value={formData.inclusions}
                      onChange={(e) => setFormData({...formData, inclusions: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exclusions</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="What's excluded"
                      value={formData.exclusions}
                      onChange={(e) => setFormData({...formData, exclusions: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <Input 
                        type="number" 
                        placeholder="Enter price"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost Type</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.costType}
                        onChange={(e) => setFormData({...formData, costType: e.target.value})}
                      >
                        <option value="per_person">Per Person</option>
                        <option value="per_group">Per Group</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operating Days</label>
                    <Input 
                      type="text" 
                      placeholder="e.g., Monday-Sunday, Daily"
                      value={formData.operatingDays}
                      onChange={(e) => setFormData({...formData, operatingDays: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Slots</label>
                    <Input 
                      type="text" 
                      placeholder="e.g., 9:00 AM, 2:00 PM, 6:00 PM (comma separated)"
                      value={formData.timeSlots}
                      onChange={(e) => setFormData({...formData, timeSlots: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images / Gallery
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="photo"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0) {
                            setSelectedFiles(files)
                            Promise.all(files.map(f => {
                              return new Promise<string>((resolve) => {
                                const reader = new FileReader()
                                reader.onload = () => resolve(reader.result as string)
                                reader.readAsDataURL(f)
                              })
                            })).then(base64Array => {
                              setFormData({...formData, gallery: base64Array})
                            })
                          }
                        }}
                      />
                      <label
                        htmlFor="photo"
                        className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200 text-sm"
                      >
                        Choose Files
                      </label>
                      <span className="text-sm text-gray-500">{selectedFiles.length > 0 ? `${selectedFiles.length} file(s)` : 'No files chosen'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Additional notes"
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

              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
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
                    onClick={handleSaveActivity}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingActivity ? 'Update' : 'Save')}
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

export default Activities

