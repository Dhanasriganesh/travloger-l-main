import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Destination {
  id: number
  name: string
  state?: string
  country?: string
  description?: string
  best_season?: string
  default_currency?: string
  timezone?: string
  status?: string
  created_by: string
  date: string
  created_at?: string
  updated_at?: string
}

const Destinations: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newDestinationName, setNewDestinationName] = useState('')
  const [stateRegion, setStateRegion] = useState('')
  const [country, setCountry] = useState('')
  const [description, setDescription] = useState('')
  const [bestSeason, setBestSeason] = useState('')
  const [defaultCurrency, setDefaultCurrency] = useState('')
  const [timezone, setTimezone] = useState('')
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null)

  // Fetch destinations from database
  useEffect(() => {
    fetchDestinations()
  }, [])

  const fetchDestinations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/destinations')
      const data = await response.json()
      if (response.ok) {
        setDestinations(data.destinations || [])
      } else {
        console.error('Failed to fetch destinations:', data.error)
      }
    } catch (error) {
      console.error('Error fetching destinations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDestination = async () => {
    if (!newDestinationName.trim()) {
      alert('Please enter a destination name')
      return
    }

    try {
      setSaving(true)
      const method = editingDestination ? 'PUT' : 'POST'
      const base = {
        name: newDestinationName,
        state: stateRegion,
        country,
        description,
        best_season: bestSeason,
        default_currency: defaultCurrency,
        timezone
      }
      const body = editingDestination 
        ? { id: editingDestination.id, status: editingDestination.status, ...base }
        : base

      const response = await fetch('/api/destinations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchDestinations() // Refresh the list
        setShowAddForm(false)
        setNewDestinationName('')
        setStateRegion('')
        setCountry('')
        setDescription('')
        setBestSeason('')
        setDefaultCurrency('')
        setTimezone('')
        setEditingDestination(null)
        alert(data.message || 'Destination saved successfully')
      } else {
        alert(data.error || 'Failed to save destination')
      }
    } catch (error) {
      console.error('Error saving destination:', error)
      alert('Error saving destination')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDestination = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/destinations?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchDestinations() // Refresh the list
        alert(data.message || 'Destination deleted successfully')
      } else {
        alert(data.error || 'Failed to delete destination')
      }
    } catch (error) {
      console.error('Error deleting destination:', error)
      alert('Error deleting destination')
    }
  }

  const handleEditClick = (destination: Destination) => {
    setEditingDestination(destination)
    setNewDestinationName(destination.name)
    setStateRegion(destination.state || '')
    setCountry(destination.country || '')
    setDescription(destination.description || '')
    setBestSeason(destination.best_season || '')
    setDefaultCurrency(destination.default_currency || '')
    setTimezone(destination.timezone || '')
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setNewDestinationName('')
    setEditingDestination(null)
  }

  const filteredDestinations = destinations.filter(destination =>
    destination.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <h1 className="text-lg font-bold text-gray-900">Destinations</h1>
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
              onClick={() => {
                setEditingDestination(null)
                setNewDestinationName('')
                setShowAddForm(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-sm"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Destination
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-2/5 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="w-1/4 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                      <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDestinations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                          {searchTerm ? 'No destinations found matching your search' : 'No destinations added yet'}
                        </td>
                      </tr>
                    ) : (
                      filteredDestinations.map((destination) => (
                        <tr key={destination.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 text-sm font-medium text-gray-900">
                            {destination.name}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">T</span>
                              </div>
                              <span className="text-xs text-gray-700 truncate">{destination.created_by}</span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900">
                            {destination.date}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <button 
                              className="hover:text-gray-700"
                              onClick={() => handleEditClick(destination)}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <button 
                              className="hover:text-red-600"
                              onClick={() => handleDeleteDestination(destination.id, destination.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total Records */}
        <div className="mt-4 text-sm text-gray-600">
          Total Records: {filteredDestinations.length}
        </div>
      </div>

      {/* Add/Edit Destination Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            onClick={handleCloseForm}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingDestination ? 'Edit Destination' : 'Add Destination'}
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

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveDestination(); }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Name
                </label>
                <Input 
                  type="text" 
                  className="border-l-2 border-red-500"
                  placeholder="Enter destination name"
                  value={newDestinationName}
                  onChange={(e) => setNewDestinationName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State / Region</label>
                  <Input 
                    type="text"
                    placeholder="e.g., Kerala"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <Input 
                    type="text"
                    placeholder="e.g., India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Highlights</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Short description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Best Season</label>
                  <Input 
                    type="text"
                    placeholder="e.g., Oct–Mar"
                    value={bestSeason}
                    onChange={(e) => setBestSeason(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                  <Input 
                    type="text"
                    placeholder="e.g., INR"
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <Input 
                    type="text"
                    placeholder="e.g., Asia/Kolkata"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  />
                </div>
              </div>
            </form>

            <div className="flex justify-end mt-6 space-x-3">
              <Button
                variant="outline"
                onClick={handleCloseForm}
                className="text-gray-700 bg-gray-100 hover:bg-gray-200"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveDestination}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingDestination ? 'Update' : 'Save'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Destinations

