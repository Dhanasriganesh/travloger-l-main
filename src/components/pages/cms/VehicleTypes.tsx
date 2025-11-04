import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft } from 'lucide-react'

interface VehicleType {
  id: number
  vehicle_type: string
  capacity?: number
  description?: string
  notes?: string
  status: string
  created_by: string
  date: string
}

const VehicleTypes: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<VehicleType | null>(null)

  const [formData, setFormData] = useState({
    vehicleType: '',
    capacity: 4,
    description: '',
    notes: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchVehicleTypes()
  }, [])

  const fetchVehicleTypes = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vehicle-types')
      const data = await res.json()
      if (res.ok) setVehicleTypes(data.vehicleTypes || [])
      else console.error('Failed to fetch vehicle types:', data.error)
    } catch (e) {
      console.error('Error fetching vehicle types:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.vehicleType.trim()) {
      alert('Please enter a vehicle type')
      return
    }
    try {
      setSaving(true)
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { id: editing.id, ...formData } : formData
      const res = await fetch('/api/vehicle-types', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (res.ok) {
        await fetchVehicleTypes()
        setShowAddForm(false)
        setEditing(null)
        setFormData({ vehicleType: '', capacity: 4, description: '', notes: '', status: 'Active' })
        alert(data.message || 'Saved successfully')
      } else {
        alert(data.error || 'Failed to save')
      }
    } catch (e) {
      console.error('Error saving vehicle type:', e)
      alert('Error saving vehicle type')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      const res = await fetch(`/api/vehicle-types?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        await fetchVehicleTypes()
        alert(data.message || 'Deleted successfully')
      } else alert(data.error || 'Failed to delete')
    } catch (e) {
      console.error('Error deleting vehicle type:', e)
      alert('Error deleting vehicle type')
    }
  }

  const handleEditClick = (row: VehicleType) => {
    setEditing(row)
    setFormData({
      vehicleType: row.vehicle_type,
      capacity: row.capacity || 4,
      description: row.description || '',
      notes: row.notes || '',
      status: row.status || 'Active'
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditing(null)
    setFormData({ vehicleType: '', capacity: 4, description: '', notes: '', status: 'Active' })
  }

  const filtered = vehicleTypes.filter(vt =>
    vt.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading vehicle types...</p>
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
              <h1 className="text-lg font-bold text-gray-900">Vehicle Types</h1>
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
              Add Vehicle Type
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
                    <th className="w-40 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="w-40 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-10 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    <th className="w-10 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">{row.vehicle_type}</td>
                      <td className="px-3 py-4 text-sm text-gray-900">{row.capacity ?? '-'}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 truncate">{row.description || '-'}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 truncate">{row.notes || '-'}</td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Badge variant="success" className="bg-green-600 text-white">
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">{row.created_by || '-'}</td>
                      <td className="px-3 py-4 text-sm text-gray-900">{row.date}</td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button className="hover:text-gray-700" onClick={() => handleEditClick(row)}>
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button className="hover:text-red-600" onClick={() => handleDelete(row.id, row.vehicle_type)}>
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
        <div className="mt-4 text-sm text-gray-600">Total Records: {filtered.length}</div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-sm" onClick={handleCloseForm} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Vehicle Type' : 'Add Vehicle Type'}</h2>
              <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-4" onSubmit={(e)=>{e.preventDefault();handleSave();}}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <Input
                  type="text"
                  placeholder="e.g., Sedan, SUV, Tempo Traveller"
                  value={formData.vehicleType}
                  onChange={(e)=>setFormData({...formData, vehicleType: e.target.value})}
                  className="border-l-2 border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <Input
                  type="number"
                  placeholder="e.g., 4"
                  value={formData.capacity}
                  onChange={(e)=>setFormData({...formData, capacity: parseInt(e.target.value)||0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input
                  type="text"
                  placeholder="AC / Non-AC, Luxury / Standard"
                  value={formData.description}
                  onChange={(e)=>setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Input
                  type="text"
                  placeholder="Any notes"
                  value={formData.notes}
                  onChange={(e)=>setFormData({...formData, notes: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e)=>setFormData({...formData, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <Button variant="outline" onClick={handleCloseForm} className="text-gray-700 bg-gray-100 hover:bg-gray-200" disabled={saving}>Cancel</Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleTypes




